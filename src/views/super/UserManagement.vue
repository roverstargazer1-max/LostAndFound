<template>
  <div class="user-page">
    <div class="panel">
      <div class="search-row">
        <el-input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索用户名或账号"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select v-model="filterRole" class="filter-select" placeholder="全部角色">
          <el-option label="全部角色" value="" />
          <el-option label="超级管理员" value="super" />
          <el-option label="学生/老师" value="student" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-select v-model="filterStatus" class="filter-select" placeholder="全部状态">
          <el-option label="全部状态" value="" />
          <el-option label="无" value="none" />
          <el-option label="启用" value="enabled" />
          <el-option label="禁用" value="disabled" />
        </el-select>
        <el-button class="search-btn" type="warning" @click="handleSearch">搜索</el-button>
        <el-button class="reset-btn" @click="handleReset">重置</el-button>
      </div>

      <div class="action-row">
        <div class="left-actions">
          <el-button class="gray-btn" :loading="batchLoading" @click="handleBatchEnable">批量启用</el-button>
          <el-button class="gray-btn" :loading="batchLoading" @click="handleBatchDisable">批量禁用</el-button>
        </div>
        <el-button class="add-btn" type="warning" @click="showCreateAdmin = true">+ 批量新增管理员</el-button>
      </div>

      <div class="table-wrap" v-loading="loading">
        <table class="user-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>姓名</th>
              <th>角色</th>
              <th>账号</th>
              <th>注册时间</th>
              <th>最后登录</th>
              <th>状态</th>
              <th>操作</th>
              <th>
                <el-checkbox :model-value="allPageChecked" @change="handlePageCheckChange" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in pagedUsers" :key="row.ID || row.id">
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ row.name || '--' }}</td>
              <td>{{ roleText(row.role) }}</td>
              <td>{{ row.username || '--' }}</td>
              <td>{{ formatDate(row.CreatedAt) }}</td>
              <td>{{ formatDate(row.last_login || row.UpdatedAt || row.CreatedAt) }}</td>
              <td>
                <span class="status-pill" :class="statusClass(row)">
                  {{ statusText(row) }}
                </span>
              </td>
              <td class="op-cell">
                <el-button
                  class="notify-btn"
                  size="small"
                  :disabled="!canSendNotice(row)"
                  @click="openMessage(row)"
                >
                  {{ canSendNotice(row) ? '发送通知' : '不可发送' }}
                </el-button>
              </td>
              <td>
                <el-checkbox
                  :model-value="selectedIds.has(getRowId(row))"
                  @change="handleRowCheckChange(row, $event)"
                />
              </td>
            </tr>
            <tr v-if="pagedUsers.length === 0">
              <td colspan="9" class="empty-td">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="footer-row">
        <span class="record-text">显示第 {{ pageStart }} 到 {{ pageEnd }} 条，共 {{ filteredUsers.length }} 条记录</span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredUsers.length"
          layout="prev, pager, next"
          background
        />
      </div>
    </div>

    <el-dialog v-model="showCreateAdmin" title="批量新增管理员" width="520px" destroy-on-close>
      <el-form :model="adminForm" label-width="90px">
        <el-form-item label="账号">
          <el-input v-model="adminForm.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="adminForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="adminForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateAdmin = false">取消</el-button>
        <el-button type="warning" :loading="createLoading" @click="handleCreateAdmin">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMessageDialog" width="760px" destroy-on-close>
      <template #header>
        <div class="msg-title">发送给：{{ messageTargetName }}</div>
      </template>
      <div class="msg-subtitle">填写发送内容：</div>
      <el-input
        v-model="messageContent"
        type="textarea"
        :rows="8"
        maxlength="500"
        show-word-limit
        placeholder="请添入文字"
      />
      <template #footer>
        <div class="msg-footer">
          <el-button @click="showMessageDialog = false">取消</el-button>
          <el-button type="warning" :loading="messageLoading" @click="handleSendMessage">发送</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 页面注释：UserManagement 页面的状态管理、交互处理与接口调用逻辑。
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createAdmin, getUserList, sendMessage, updateUserStatus } from '@/api/super'

type UserRow = {
  ID: number
  id?: number
  username: string
  name: string
  role: number
  is_active: boolean
  CreatedAt?: string
  UpdatedAt?: string
  last_login?: string
}

const loading = ref(false)
const createLoading = ref(false)
const batchLoading = ref(false)
const messageLoading = ref(false)

const currentPage = ref(1)
const pageSize = ref(8)
const userList = ref<UserRow[]>([])

const searchKeyword = ref('')
const filterRole = ref('')
const filterStatus = ref('')

const selectedIds = ref<Set<number>>(new Set())

const showCreateAdmin = ref(false)
const showMessageDialog = ref(false)

const adminForm = reactive({
  username: '',
  name: '',
  password: '',
})

const messageTargetId = ref<number>(0)
const messageTargetName = ref('')
const messageContent = ref('')

const filteredUsers = computed(() => {
  const text = searchKeyword.value.trim().toLowerCase()
  return userList.value.filter((row) => {
    const role = roleKey(row.role)
    const status = statusKey(row)

    const matchKeyword =
      !text || row.name?.toLowerCase().includes(text) || row.username?.toLowerCase().includes(text)
    const matchRole = !filterRole.value || role === filterRole.value
    const matchStatus = !filterStatus.value || status === filterStatus.value
    return matchKeyword && matchRole && matchStatus
  })
})

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

const pageStart = computed(() => (filteredUsers.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1))
const pageEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredUsers.value.length))
const allPageChecked = computed(() => {
  if (pagedUsers.value.length === 0) return false
  return pagedUsers.value.every((u) => selectedIds.value.has(u.ID || u.id || 0))
})

watch([searchKeyword, filterRole, filterStatus], () => {
  currentPage.value = 1
})

function roleKey(role: number) {
  if (role === 3) return 'super'
  if (role === 2) return 'admin'
  return 'student'
}

function roleText(role: number) {
  if (role === 3) return '超级管理员'
  if (role === 2) return '管理员'
  return '学生/老师'
}

function getRowId(row: UserRow) {
  return row.ID || row.id || 0
}

function canSendNotice(row: UserRow) {
  return row.role !== 2 && row.role !== 3
}

function statusKey(row: UserRow) {
  if (row.role !== 2) return 'none'
  return row.is_active ? 'enabled' : 'disabled'
}

function statusText(row: UserRow) {
  if (row.role !== 2) return '无'
  return row.is_active ? '启用' : '禁用'
}

function statusClass(row: UserRow) {
  if (row.role !== 2) return 'status-none'
  return row.is_active ? 'status-enabled' : 'status-disabled'
}

function formatDate(val?: string) {
  if (!val) return '--'
  const raw = String(val).trim()
  if (!raw || raw.startsWith('0001-01-01') || raw.startsWith('1970-01-01')) return '--'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toISOString().slice(0, 10)
}

async function fetchUsers() {
  loading.value = true
  try {
    const roleMap: Record<string, number | undefined> = {
      super: 3,
      student: 1,
      teacher: 1,
      admin: 2,
    }
    const res = await getUserList({
      page: 1,
      pageSize: 200,
      role: roleMap[filterRole.value],
      keyword: searchKeyword.value || undefined,
    })
    const data = res.data?.data ?? res.data ?? {}
    const list = data.list ?? []
    userList.value = Array.isArray(list) ? list : []
    const validIds = new Set(userList.value.map((u) => getRowId(u)).filter(Boolean))
    selectedIds.value = new Set(Array.from(selectedIds.value).filter((id) => validIds.has(id)))
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '获取用户失败'
    ElMessage.error(err)
    userList.value = []
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  fetchUsers()
}

function handleReset() {
  searchKeyword.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  fetchUsers()
}

function onSelectRow(row: UserRow, checked: boolean) {
  const id = getRowId(row)
  const next = new Set(selectedIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedIds.value = next
}

function handlePageCheckChange(val: string | number | boolean) {
  toggleCurrentPage(Boolean(val))
}

function handleRowCheckChange(row: UserRow, val: string | number | boolean) {
  onSelectRow(row, Boolean(val))
}

function toggleCurrentPage(checked: boolean) {
  const next = new Set(selectedIds.value)
  for (const row of pagedUsers.value) {
    const id = getRowId(row)
    if (!id) continue
    if (checked) next.add(id)
    else next.delete(id)
  }
  selectedIds.value = next
}

function getSelectedRows() {
  return userList.value.filter((u) => selectedIds.value.has(getRowId(u)))
}

async function handleBatchEnable() {
  if (batchLoading.value) return
  const rows = getSelectedRows().filter((u) => u.role === 2 || u.role === 3)
  if (rows.length === 0) {
    ElMessage.warning('请至少勾选一个管理员')
    return
  }
  batchLoading.value = true
  try {
    await Promise.all(rows.map((u) => updateUserStatus(getRowId(u), { is_active: true })))
    ElMessage.success('批量启用成功')
    await fetchUsers()
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '批量启用失败'
    ElMessage.error(err)
  } finally {
    batchLoading.value = false
  }
}

async function handleBatchDisable() {
  if (batchLoading.value) return
  const rows = getSelectedRows().filter((u) => u.role === 2 || u.role === 3)
  if (rows.length === 0) {
    ElMessage.warning('请至少勾选一个管理员')
    return
  }
  batchLoading.value = true
  try {
    await Promise.all(rows.map((u) => updateUserStatus(getRowId(u), { is_active: false })))
    ElMessage.success('批量禁用成功')
    await fetchUsers()
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '批量禁用失败'
    ElMessage.error(err)
  } finally {
    batchLoading.value = false
  }
}

async function handleCreateAdmin() {
  if (!adminForm.username.trim() || !adminForm.name.trim() || !adminForm.password.trim()) {
    ElMessage.warning('请填写完整信息')
    return
  }
  createLoading.value = true
  try {
    await createAdmin({
      username: adminForm.username,
      name: adminForm.name,
      password: adminForm.password,
    })
    ElMessage.success('创建成功')
    showCreateAdmin.value = false
    adminForm.username = ''
    adminForm.name = ''
    adminForm.password = ''
    fetchUsers()
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '创建失败'
    ElMessage.error(err)
  } finally {
    createLoading.value = false
  }
}

function openMessage(row: UserRow) {
  if (!canSendNotice(row)) {
    ElMessage.warning('管理员和超级管理员不可接收此通知')
    return
  }
  messageTargetId.value = getRowId(row)
  messageTargetName.value = row.name || row.username || '--'
  messageContent.value = ''
  showMessageDialog.value = true
}

async function handleSendMessage() {
  if (messageLoading.value) return
  if (!messageTargetId.value) {
    ElMessage.warning('接收用户无效')
    return
  }
  if (!messageContent.value.trim()) {
    ElMessage.warning('请填写发送内容')
    return
  }
  messageLoading.value = true
  try {
    await sendMessage({
      receiver_id: messageTargetId.value,
      content: messageContent.value,
      type: 1,
    })
    ElMessage.success('发送成功')
    showMessageDialog.value = false
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '发送失败'
    ElMessage.error(err)
  } finally {
    messageLoading.value = false
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.user-page {
  padding: 10px;
}

.panel {
  background: #fdf6ec;
  border: 1px solid #f5d4a0;
  border-radius: 10px;
  padding: 16px;
}

.search-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr auto auto;
  gap: 12px;
  align-items: center;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 14px;
}

.search-input,
.filter-select {
  width: 100%;
}

.search-btn {
  background: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

.reset-btn {
  background: #edf0f3;
  border-color: #edf0f3;
  color: #5b6574;
}

.action-row {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-actions {
  display: flex;
  gap: 10px;
}

.gray-btn {
  background: #edf0f3;
  border-color: #edf0f3;
  color: #596476;
}

.add-btn {
  background: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

.table-wrap {
  margin-top: 12px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
  overflow: hidden;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  border-bottom: 1px solid #eef2f7;
  padding: 12px 10px;
  font-size: 14px;
  color: #4b5563;
  text-align: left;
}

.user-table th {
  background: #f3f6fb;
  color: #6b7280;
  font-weight: 600;
}

.user-table tr:last-child td {
  border-bottom: none;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-none {
  background: #ebedf2;
  color: #5b6472;
}

.status-enabled {
  background: #d9f3df;
  color: #1f7a32;
}

.status-disabled {
  background: #f8e0e0;
  color: #a64b4b;
}

.op-cell {
  white-space: nowrap;
}

.notify-btn {
  background: #e6a23c;
  border: 1px solid #e6a23c;
  color: #fff;
  border-radius: 8px;
  padding: 4px 12px;
  font-weight: 600;
}

:deep(.el-checkbox__inner) {
  border-radius: 50%;
}

.empty-td {
  text-align: center;
  color: #9ca3af;
}

.footer-row {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-text {
  color: #4b5563;
  font-size: 14px;
}

.msg-title {
  font-size: 24px;
  font-weight: 700;
  color: #374151;
}

.msg-subtitle {
  font-size: 18px;
  color: #374151;
  margin-bottom: 10px;
  font-weight: 600;
}

.msg-footer {
  display: flex;
  justify-content: center;
  gap: 60px;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #e6a23c;
}

@media (max-width: 900px) {
  .search-row {
    grid-template-columns: 1fr;
  }

  .action-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .left-actions {
    flex-wrap: wrap;
  }

  .footer-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .msg-title {
    font-size: 22px;
  }

  .msg-subtitle {
    font-size: 22px;
  }
}
</style>





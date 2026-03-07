<template>
  <div class="notice-page">
    <div class="notice-panel">
      <h2 class="page-title">公告管理</h2>

      <div class="toolbar">
        <el-button class="publish-btn" type="warning" @click="openPublishDialog">+发布全局公告</el-button>
        <el-select v-model="filterStatus" class="status-select" placeholder="全部状态">
          <el-option label="全部状态" value="" />
          <el-option label="已发布" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="待审核" value="pending" />
        </el-select>
        <el-input v-model="keyword" class="search-input" placeholder="搜索公告..." clearable />
      </div>

      <div class="notice-list" v-loading="loading">
        <div v-for="item in pagedNotices" :key="item.ID" class="notice-card">
          <div class="card-main">
            <h3 class="notice-title">{{ item.title }}</h3>
            <p class="notice-content">{{ item.content }}</p>
            <div class="notice-meta">
              <span>{{ item.publisher || '系统管理员' }}</span>
              <span>·</span>
              <span>{{ formatDate(item.CreatedAt) }}</span>
              <span class="region-chip">区域：{{ getRegionLabel(item) }}</span>
              <el-tag size="small" round :type="statusTagType(item.status)" class="status-tag">
                {{ statusText(item.status) }}
              </el-tag>
            </div>
          </div>

          <div class="card-actions">
            <el-button
              link
              type="primary"
              class="action-link"
              :class="{ 'action-link-disabled': normalizeStatus(item.status) === 'approved' || normalizeStatus(item.status) === 'rejected' }"
              :disabled="normalizeStatus(item.status) === 'approved' || normalizeStatus(item.status) === 'rejected'"
              @click="openAuditDialog(item)"
            >
              审核
            </el-button>
            <el-button link type="danger" @click="handleDelete(item)">删除</el-button>
          </div>
        </div>
      </div>

      <div class="footer-bar">
        <span class="record-text">显示第 {{ pageStart }} 到 {{ pageEnd }} 条，共 {{ filteredNotices.length }} 条记录</span>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredNotices.length"
          layout="prev, pager, next"
          background
        />
      </div>
    </div>

    <el-dialog v-model="publishVisible" title="发布新公告" width="900px" destroy-on-close>
      <el-form :model="publishForm" label-position="top">
        <el-form-item label="标题">
          <el-input v-model="publishForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="publishForm.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="发布范围">
          <el-select v-model="publishForm.type" style="width: 100%;">
            <el-option label="全体用户" value="system" />
            <el-option label="区域用户" value="region" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="publish-footer-btn" type="warning" :loading="publishing" @click="handlePublish">发布公告</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditVisible" title="" width="860px" destroy-on-close>
      <template v-if="currentNotice">
        <div class="detail-title">{{ currentNotice.title }}</div>
        <div class="detail-body">{{ currentNotice.content }}</div>
        <div class="detail-meta">
          <span>{{ currentNotice.publisher || '信息技术中心' }}</span>
          <span>发布时间{{ formatDate(currentNotice.CreatedAt) }}</span>
          <span>区域：{{ getRegionLabel(currentNotice) }}</span>
        </div>
      </template>
      <template #footer>
        <div class="audit-footer">
          <el-button type="success" plain :loading="auditLoading" @click="handleAudit('approved')">通过</el-button>
          <el-button type="danger" plain :loading="auditLoading" @click="handleAudit('rejected')">驳回</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
// 页面注释：SuperNotice 页面的状态管理、交互处理与接口调用逻辑。
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createSystemAnnouncement, deleteAnnouncement, getAnnouncements, reviewAnnouncement } from '@/api/super'

type NoticeRow = {
  ID: number
  title: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | string
  type: string
  region?: string
  publisher?: string
  CreatedAt: string
}

const loading = ref(false)
const publishing = ref(false)
const auditLoading = ref(false)

const allNotices = ref<NoticeRow[]>([])
const currentPage = ref(1)
const pageSize = ref(4)
const filterStatus = ref('')
const keyword = ref('')

const publishVisible = ref(false)
const auditVisible = ref(false)

const currentNotice = ref<NoticeRow | null>(null)

const publishForm = reactive({
  title: '',
  content: '',
  type: 'system',
})

const filteredNotices = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return allNotices.value.filter((n) => {
    const statusMatch = !filterStatus.value || normalizeStatus(n.status) === filterStatus.value
    const keywordMatch = !text || n.title.toLowerCase().includes(text) || n.content.toLowerCase().includes(text)
    return statusMatch && keywordMatch
  })
})

const pageStart = computed(() => {
  if (filteredNotices.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})

const pageEnd = computed(() => {
  const end = currentPage.value * pageSize.value
  return Math.min(end, filteredNotices.value.length)
})

const pagedNotices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredNotices.value.slice(start, start + pageSize.value)
})

watch([filterStatus, keyword], () => {
  currentPage.value = 1
})

watch(filterStatus, () => {
  fetchNotices()
})

watch(filteredNotices, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value))
  if (currentPage.value > maxPage) currentPage.value = maxPage
})

function formatDate(value?: string) {
  if (!value) return '--'
  return new Date(value).toLocaleString('zh-CN')
}

function statusText(status: string) {
  const normalized = normalizeStatus(status)
  if (normalized === 'approved') return '已发布'
  if (normalized === 'rejected') return '已驳回'
  return '待审核'
}

function statusTagType(status: string) {
  const normalized = normalizeStatus(status)
  if (normalized === 'approved') return 'success'
  if (normalized === 'rejected') return 'danger'
  return 'info'
}

function normalizeStatus(status?: string) {
  const s = (status || '').toLowerCase()
  if (['approved', 'published', 'pass', 'passed', 'success', '1', '已发布', '已通过'].includes(s)) return 'approved'
  if (['rejected', 'reject', 'failed', 'fail', '2', '已驳回'].includes(s)) return 'rejected'
  return 'pending'
}

function getRegionLabel(item: Partial<NoticeRow> | null | undefined) {
  if (!item) return '未指定'
  const type = String(item.type || '').toLowerCase()
  const region = String(item.region || '').trim()
  if (type === 'system') return '全体用户'
  return region || '未指定'
}

async function fetchNotices() {
  loading.value = true
  try {
    const res = await getAnnouncements({
      page: 1,
      pageSize: 500,
      status: filterStatus.value || undefined,
    })
    const data = res.data?.data ?? res.data ?? {}
    const list = data.list ?? []
    allNotices.value = Array.isArray(list)
      ? list.map((item: NoticeRow) => ({
          ...item,
          status: normalizeStatus(item.status),
        }))
      : []
  } catch {
    allNotices.value = []
    ElMessage.error('获取公告失败')
  } finally {
    loading.value = false
  }
}

function openPublishDialog() {
  publishVisible.value = true
}

function openAuditDialog(row: NoticeRow) {
  currentNotice.value = row
  auditVisible.value = true
}

async function handlePublish() {
  if (!publishForm.title.trim() || !publishForm.content.trim()) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  publishing.value = true
  try {
    await createSystemAnnouncement({
      title: publishForm.title,
      content: publishForm.content,
      type: publishForm.type,
    })
    ElMessage.success('发布成功')
    publishVisible.value = false
    publishForm.title = ''
    publishForm.content = ''
    publishForm.type = 'system'
    await fetchNotices()
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '发布失败'
    ElMessage.error(err)
  } finally {
    publishing.value = false
  }
}

async function handleAudit(status: 'approved' | 'rejected') {
  if (!currentNotice.value) return
  auditLoading.value = true
  try {
    const apiStatus = status === 'approved' ? 'published' : 'rejected'
    await reviewAnnouncement({ id: currentNotice.value.ID, status: apiStatus })
    ElMessage.success(status === 'approved' ? '已通过' : '已驳回')
    allNotices.value = allNotices.value.map((item) =>
      item.ID === currentNotice.value?.ID ? { ...item, status: apiStatus } : item
    )
    auditVisible.value = false
    await fetchNotices()
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : '审核失败'
    ElMessage.error(err)
  } finally {
    auditLoading.value = false
  }
}

async function handleDelete(row: NoticeRow) {
  try {
    await ElMessageBox.confirm(`确认删除公告「${row.title}」吗？`, '提示', { type: 'warning' })
    await deleteAnnouncement(row.ID)
    ElMessage.success('删除成功')
    await fetchNotices()
  } catch (error: unknown) {
    if (error === 'cancel' || error === 'close') return
    const err = error instanceof Error ? error.message : '删除失败'
    ElMessage.error(err)
  }
}

onMounted(fetchNotices)
</script>

<style scoped>
.notice-page {
  padding: 10px;
}

.notice-panel {
  background: #ffffff;
  border: 1px solid #f5d4a0;
  border-radius: 10px;
  padding: 20px;
}

.page-title {
  margin: 0 0 14px 0;
  font-size: 22px;
  color: #1f2430;
  font-weight: 700;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 16px;
}

.publish-btn {
  background: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

.status-select {
  width: 120px;
}

.search-input {
  width: 220px;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 430px;
}

.notice-card {
  border: 1px solid #e9e9e9;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-main {
  flex: 1;
  min-width: 0;
}

.notice-title {
  margin: 0;
  font-size: 18px;
  color: #111827;
  font-weight: 700;
}

.notice-content {
  margin: 6px 0 8px 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.region-chip {
  color: #9ca3af;
}

.status-tag {
  margin-left: 8px;
}

.card-actions {
  display: flex;
  gap: 6px;
  padding-left: 16px;
}
.action-link-disabled {
  color: #b7bdc8 !important;
}
:deep(.el-button.is-disabled.action-link-disabled) {
  color: #b7bdc8 !important;
}

.footer-bar {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-text {
  color: #4b5563;
  font-size: 14px;
}

.detail-title {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px 14px;
  font-size: 22px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 14px;
}

.detail-body {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  min-height: 280px;
  padding: 12px 14px;
  white-space: pre-wrap;
  font-size: 15px;
  line-height: 1.65;
  color: #374151;
}

.detail-meta {
  margin-top: 12px;
  text-align: right;
  color: #4b5563;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.audit-footer {
  display: flex;
  justify-content: center;
  gap: 60px;
}

.publish-footer-btn {
  background: #e6a23c;
  border-color: #e6a23c;
  color: #fff;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #e6a23c;
}

@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .status-select,
  .search-input {
    width: 100%;
  }

  .notice-card {
    flex-direction: column;
    gap: 10px;
  }

  .card-actions {
    padding-left: 0;
  }

  .footer-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>





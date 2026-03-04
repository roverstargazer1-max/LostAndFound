<template>
  <div class="item-page">
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索"
        :prefix-icon="Search"
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <el-button plain @click="toggleBatchMode">
        {{ batchMode ? '退出批量' : '批量管理' }}
      </el-button>
    </div>

    <div v-if="batchMode" class="batch-bar">
      <el-checkbox
        v-model="selectAll"
        :indeterminate="isIndeterminate"
        @change="handleSelectAll"
      >全选</el-checkbox>
      <span class="batch-count">已选 {{ selectedIds.length }} 项</span>
      <el-button type="success" size="small" :disabled="selectedIds.length === 0" :loading="batchLoading" @click="handleBatchArchive">
        批量归档
      </el-button>
      <el-button type="danger" size="small" :disabled="selectedIds.length === 0" :loading="batchLoading" @click="handleBatchCancel">
        批量作废
      </el-button>
    </div>

    <div class="filter-illustration-section">
      <div class="filter-area">
        <div class="filter-groups">
          <div class="filter-row">
            <el-button
              v-for="opt in typeOptions"
              :key="opt.value"
              :type="filterType === opt.value ? 'warning' : 'default'"
              round
              size="small"
              @click="applyFilter('type', opt.value)"
            >{{ opt.label }}</el-button>
          </div>

          <div class="filter-row">
            <el-button
              v-for="opt in campusFilterOptions"
              :key="opt.value"
              :type="filterCampus === opt.value ? 'warning' : 'default'"
              round
              size="small"
              @click="applyFilter('campus', opt.value)"
            >{{ opt.label }}</el-button>
          </div>

          <div class="filter-row">
            <el-button
              v-for="opt in statusOptions"
              :key="opt.value"
              :type="filterStatus === opt.value ? 'warning' : 'default'"
              round
              size="small"
              @click="applyFilter('status', opt.value)"
            >{{ opt.label }}</el-button>
          </div>

          <div class="filter-row">
            <el-button
              v-for="opt in timeOptions"
              :key="opt.value"
              :type="filterTime === opt.value ? 'warning' : 'default'"
              round
              size="small"
              @click="applyFilter('time', opt.value)"
            >{{ opt.label }}</el-button>
          </div>

          <div class="filter-row">
            <el-button
              v-for="opt in categoryFilterOptions"
              :key="opt.value"
              :type="filterCategory === opt.value ? 'warning' : 'default'"
              round
              size="small"
              @click="applyFilter('category', opt.value)"
            >{{ opt.label }}</el-button>
          </div>
        </div>
      </div>
      <div class="filter-illustration" aria-hidden="true">
        <img src="/6副.png" alt="物品示意图" />
      </div>
    </div>

    <div class="list-shell" :class="{ 'is-switching': switching }">
      <div class="card-grid" v-loading="loading">
        <div
          v-for="item in itemList"
          :key="item.id ?? item.ID"
          class="item-card"
          :class="{ 'card-selected': batchMode && selectedIds.includes(item.id ?? item.ID) }"
          @click="batchMode ? toggleSelect(item) : showItemDetail(item)"
        >
          <div v-if="batchMode" class="card-checkbox" @click.stop>
            <el-checkbox
              :model-value="selectedIds.includes(item.id ?? item.ID)"
              @change="toggleSelect(item)"
            />
          </div>

          <div class="card-body">
            <div class="card-info">
              <p class="card-title">物品名称：{{ item.title || item.category || '--' }}</p>
              <p>{{ isLost(item) ? '丢失' : '拾取' }}时间：{{ item.time || '--' }}</p>
              <p>{{ isLost(item) ? '丢失' : '拾取' }}地点：{{ item.location || '--' }}</p>
            </div>
            <el-icon class="card-more" :size="20" color="#999"><MoreFilled /></el-icon>
          </div>

          <div class="card-tags">
            <div class="tag-item">
              <span class="tag-dot" :class="canEditInfo(item) ? 'green' : 'gray'"></span>
              <el-tag size="small" :type="canEditInfo(item) ? 'success' : 'info'" effect="plain" round>
                {{ canEditInfo(item) ? '可编辑（招领帖）' : '不可编辑（失物帖）' }}
              </el-tag>
            </div>
            <div class="tag-item" v-if="item.campus">
              <span class="tag-dot blue"></span>
              <el-tag size="small" type="info" effect="plain" round>校区：{{ item.campus }}</el-tag>
            </div>
            <div class="tag-item" v-if="item.category">
              <span class="tag-dot orange"></span>
              <el-tag size="small" type="warning" effect="plain" round>物品类型：{{ item.category }}</el-tag>
            </div>
            <div class="tag-item">
              <span class="tag-dot yellow"></span>
              <el-tag size="small" type="warning" effect="plain" round>悬赏：{{ getBountyText(item) }}</el-tag>
            </div>
            <div class="tag-item">
              <span class="tag-dot" :class="isPublisherClaimed(item) ? 'purple' : 'gray'"></span>
              <el-tag size="small" :type="isPublisherClaimed(item) ? 'primary' : 'info'" effect="plain" round>
                {{ isPublisherClaimed(item) ? '发帖者已认领' : '发帖者待认领' }}
              </el-tag>
            </div>
          </div>

          <div class="card-images" v-if="[item.img1, item.img2].filter(Boolean).length">
            <el-image
              v-for="(img, idx) in [item.img1, item.img2].filter(Boolean)"
              :key="idx"
              :src="img"
              fit="cover"
              class="card-img"
              @click.stop
            />
          </div>
          <div class="card-images" v-else>
            <div class="card-img-placeholder">无图片</div>
          </div>
          <div class="card-footer">
            <span class="card-date">{{ item.CreatedAt ? new Date(item.CreatedAt).toLocaleString('zh-CN') : '' }}发布</span>
            <span class="card-status" :class="getStatusClass(item.status)">
              {{ getStatusLabel(item.status) }}
            </span>
          </div>
        </div>
        <div v-if="!loading && itemList.length === 0" class="empty-state">
          <el-empty description="暂无物品数据" />
        </div>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchItemList"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" width="720px" :show-close="true" top="6vh" @closed="resetDetail">
      <div class="item-detail" v-if="currentItem">
        <div class="detail-mode-bar">
          <el-radio-group v-model="editMode" size="small">
            <el-radio-button value="view">查看</el-radio-button>
            <el-radio-button value="editInfo" :disabled="!canEditCurrentItem">编辑信息</el-radio-button>
            <el-radio-button value="editStatus" :disabled="!canEditCurrentItem">更改状态</el-radio-button>
          </el-radio-group>
          <p class="edit-tip" :class="{ 'edit-tip-disabled': !canEditCurrentItem }">
            {{ canEditCurrentItem ? '当前为招领帖，可编辑信息和状态。' : '当前为失物帖，仅可查看。' }}
          </p>
        </div>

        <div v-if="editMode === 'view'">
          <div class="detail-top">
            <div class="detail-info">
              <p><strong>物品名称：</strong>{{ currentItem.title || currentItem.category }}</p>
              <p><strong>{{ isLost(currentItem) ? '丢失' : '拾取' }}时间：</strong>{{ currentItem.time || '--' }}</p>
              <p><strong>{{ isLost(currentItem) ? '丢失' : '拾取' }}地点：</strong>{{ currentItem.location || '--' }}</p>
              <p><strong>联系方式：</strong>{{ currentItem.contact_phone || '--' }}</p>
              <p><strong>联系人：</strong>{{ currentItem.contact_name || '--' }}</p>
              <p><strong>物品特征：</strong>{{ currentItem.description || '--' }}</p>
            </div>
          </div>
        </div>

        <div v-if="editMode === 'editInfo'">
          <el-form :model="editForm" label-width="90px" class="edit-form">
            <el-form-item label="物品名称">
              <el-input v-model="editForm.title" />
            </el-form-item>
            <el-form-item label="校区">
              <el-select v-model="editForm.campus" style="width: 100%">
                <el-option v-for="opt in campusOptions" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </el-form-item>
            <el-form-item label="存放地点">
              <el-input v-model="editForm.location" placeholder="更新物品当前存放地点" />
            </el-form-item>
            <el-form-item label="物品类型">
              <el-select v-model="editForm.category" style="width: 100%">
                <el-option v-for="opt in categoryOptions" :key="opt" :label="opt" :value="opt" />
              </el-select>
            </el-form-item>
            <el-form-item label="悬赏">
              <el-input-number v-model="editForm.bounty" :min="0" :step="1" style="width: 180px" />
            </el-form-item>
            <el-form-item label="时间">
              <el-input v-model="editForm.time" />
            </el-form-item>
            <el-form-item label="物品描述">
              <el-input v-model="editForm.description" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="联系人">
              <el-input v-model="editForm.contact_name" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="editForm.contact_phone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saveLoading" @click="handleSaveInfo">保存修改</el-button>
              <el-button @click="editMode = 'view'">取消</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="editMode === 'editStatus'">
          <div class="detail-top">
            <div class="detail-info">
              <p><strong>物品名称：</strong>{{ currentItem.title || currentItem.category }}</p>
              <p><strong>当前状态：</strong>
                <el-tag :type="getStatusTagType(currentItem.status)">{{ getStatusLabel(currentItem.status) }}</el-tag>
              </p>
            </div>
          </div>

          <div class="status-change-row">
            <span class="status-label">更改为：</span>
            <el-select v-model="editStatus" size="small" style="width: 140px;" @change="handleStatusSelectChange">
              <el-option label="已通过" value="approved" />
              <el-option label="已归档" value="archived" />
              <el-option label="已匹配" value="matched" />
              <el-option label="无效（作废）" value="cancelled" />
            </el-select>
          </div>

          <div class="handle-area">
            <p class="handle-label">物品处理方式 / 备注</p>
            <el-input
              v-model="handleNote"
              type="textarea"
              :rows="3"
              placeholder="请输入处理方式说明"
            />
          </div>

          <div style="text-align: right; margin-top: 16px;">
            <el-button type="primary" :loading="saveLoading" @click="handleSaveStatus">确认更改</el-button>
            <el-button @click="editMode = 'view'">取消</el-button>
          </div>
        </div>

        <div class="detail-tags">
          <div class="tag-item">
            <span class="tag-dot blue"></span>
            <el-tag type="warning" effect="plain" round>校区：{{ currentItem.campus || '--' }}</el-tag>
          </div>
          <div class="tag-item">
            <span class="tag-dot orange"></span>
            <el-tag type="warning" effect="plain" round>物品类型：{{ currentItem.category || '--' }}</el-tag>
          </div>
          <div class="tag-item">
            <span class="tag-dot yellow"></span>
            <el-tag type="warning" effect="plain" round>悬赏：{{ getBountyText(currentItem) }}</el-tag>
          </div>
          <div class="tag-item">
            <span class="tag-dot" :class="isPublisherClaimed(currentItem) ? 'purple' : 'gray'"></span>
            <el-tag :type="isPublisherClaimed(currentItem) ? 'primary' : 'info'" effect="plain" round>
              {{ isPublisherClaimed(currentItem) ? '发帖者已认领' : '发帖者待认领' }}
            </el-tag>
          </div>
        </div>

        <div class="detail-images">
          <el-image
            v-for="(img, idx) in [currentItem.img1, currentItem.img2, currentItem.img3, currentItem.img4].filter(Boolean)"
            :key="idx"
            :src="img"
            fit="cover"
            class="detail-img"
            :preview-src-list="[currentItem.img1, currentItem.img2, currentItem.img3, currentItem.img4].filter(Boolean)"
          />
        </div>
        <p class="detail-time">{{ currentItem.CreatedAt ? new Date(currentItem.CreatedAt).toLocaleString('zh-CN') : '' }}发布</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, MoreFilled } from '@element-plus/icons-vue'
import { getAllItems, archiveItem, updateItem } from '@/api/admin'
import { normalizeResourceUrl } from '@/utils/url'

const loading = ref(false)
const saveLoading = ref(false)
const itemList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(6)
const total = ref(0)
const searchKeyword = ref('')
const batchMode = ref(false)
const selectedIds = ref<number[]>([])

const filterType = ref('')
const filterCampus = ref('')
const filterStatus = ref('')
const filterTime = ref('')
const filterCategory = ref('')
const switching = ref(false)
const fullItemList = ref<any[]>([])

const campusOptions = ['朝晖', '屏峰', '莫干山']
const categoryOptions = ['电子', '证件', '衣服', '书籍', '其他']

const typeOptions = [
  { label: '全部帖子', value: '' },
  { label: '失物帖', value: '1' },
  { label: '捡到帖', value: '2' },
]

const campusFilterOptions = [
  { label: '全部校区', value: '' },
  ...campusOptions.map((v) => ({ label: v, value: v })),
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已通过', value: 'approved' },
  { label: '已匹配', value: 'matched' },
  { label: '已认领', value: 'claimed' },
]

const timeOptions = [
  { label: '全部时间', value: '' },
  { label: '0~3', value: '0-3' },
  { label: '3~7', value: '3-7' },
  { label: '7~15', value: '7-15' },
  { label: '15~30', value: '15-30' },
  { label: '>30', value: '30+' },
]

const categoryFilterOptions = [
  { label: '全部类型', value: '' },
  ...categoryOptions.map((v) => ({ label: v, value: v })),
]

const detailVisible = ref(false)
const currentItem = ref<any>(null)
const editMode = ref<'view' | 'editInfo' | 'editStatus'>('view')
const editStatus = ref('archived')
const handleNote = ref('')

const editForm = reactive({
  title: '',
  campus: '',
  location: '',
  category: '',
  bounty: 0,
  time: '',
  description: '',
  contact_name: '',
  contact_phone: '',
})

const selectAll = computed({
  get: () => itemList.value.length > 0 && selectedIds.value.length === itemList.value.length,
  set: () => {},
})

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < itemList.value.length
})
const canEditCurrentItem = computed(() => canEditInfo(currentItem.value))

function toggleBatchMode() {
  batchMode.value = !batchMode.value
  selectedIds.value = []
}

function handleSelectAll(val: boolean) {
  if (val) {
    selectedIds.value = itemList.value.map((item) => item.id ?? item.ID)
  } else {
    selectedIds.value = []
  }
}

function toggleSelect(item: any) {
  const id = item.id ?? item.ID
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(idx, 1)
  }
}

const batchLoading = ref(false)

async function handleBatchArchive() {
  if (batchLoading.value) return
  try {
    await ElMessageBox.confirm(`确定要归档选中的 ${selectedIds.value.length} 条帖子吗？`, '批量归档', { type: 'warning' })
    batchLoading.value = true
    loading.value = true
    let success = 0
    let fail = 0
    for (const id of selectedIds.value) {
      try {
        await archiveItem(id, { process_method: '批量归档' })
        success++
      } catch {
        fail++
      }
    }
    ElMessage.success(`归档完成：成功 ${success} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`)
    selectedIds.value = []
    batchMode.value = false
    fetchItemList()
  } catch {
  } finally {
    batchLoading.value = false
    loading.value = false
  }
}

async function handleBatchCancel() {
  if (batchLoading.value) return
  try {
    await ElMessageBox.confirm(`确定要作废选中的 ${selectedIds.value.length} 条帖子吗？`, '批量作废', { type: 'warning' })
    batchLoading.value = true
    loading.value = true
    let success = 0
    let fail = 0
    for (const id of selectedIds.value) {
      try {
        await updateItem(id, { status: 'cancelled' })
        success++
      } catch {
        fail++
      }
    }
    ElMessage.success(`作废完成：成功 ${success} 条${fail > 0 ? `，失败 ${fail} 条` : ''}`)
    selectedIds.value = []
    batchMode.value = false
    fetchItemList()
  } catch {
  } finally {
    batchLoading.value = false
    loading.value = false
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    matched: '已匹配',
    claimed: '已认领',
    rejected: '已驳回',
    cancelled: '无效',
    archived: '已归档',
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  if (status === 'approved') return 'status-pass'
  if (status === 'matched') return 'status-match'
  if (status === 'claimed') return 'status-claim'
  return 'status-default'
}

function getStatusTagType(status: string) {
  const map: Record<string, string> = {
    approved: 'success',
    matched: '',
    claimed: 'success',
    rejected: 'danger',
    cancelled: 'info',
    archived: 'info',
    pending: 'warning',
  }
  return map[status] || 'info'
}

function isLost(item: any) {
  const t = String(item?.type || '').toLowerCase()
  if (t === 'lost') return true
  if (t === 'found') return false
  return Number(item?.lost_or_found) === 1
}

function canEditInfo(item: any) {
  if (!item) return false
  return !isLost(item)
}

function isPublisherClaimed(item: any) {
  const status = String(item?.status || '').toLowerCase()
  return status === 'claimed'
}

function isVisibleStatus(item: any) {
  const status = String(item?.status || '').toLowerCase()
  return ['approved', 'matched', 'claimed'].includes(status)
}

async function fetchItemList() {
  loading.value = true
  try {
    const hasFilter =
      Boolean(filterType.value) ||
      Boolean(filterCampus.value) ||
      Boolean(filterStatus.value) ||
      Boolean(filterCategory.value) ||
      Boolean(searchKeyword.value.trim()) ||
      Boolean(filterTime.value)

    const params: any = hasFilter
      ? { page: 1, pageSize: 9999 }
      : { page: currentPage.value, pageSize: pageSize.value }

    const res = await getAllItems(params)
    const resData = res.data?.data ?? res.data ?? {}
    const list = (resData.list ?? resData.items ?? [])
      .map((item: any) => ({
        ...item,
        id: item.id ?? item.ID,
        img1: normalizeResourceUrl(item.img1),
        img2: normalizeResourceUrl(item.img2),
        img3: normalizeResourceUrl(item.img3),
        img4: normalizeResourceUrl(item.img4),
      }))
      .filter((item: any) => isVisibleStatus(item))
    if (!hasFilter) {
      itemList.value = list
      total.value = resData.total ?? list.length ?? 0
      fullItemList.value = list
      return
    }

    fullItemList.value = list
    const keyword = searchKeyword.value.trim().toLowerCase()
    const daysRange = parseTimeRange(filterTime.value)
    const now = Date.now()

    const filtered = fullItemList.value.filter((item: any) => {
      if (!matchPostType(item, filterType.value)) return false
      if (filterCampus.value && String(item.campus || '') !== String(filterCampus.value)) return false
      if (filterCategory.value && String(item.category || '') !== String(filterCategory.value)) return false
      if (filterStatus.value && String(item.status) !== String(filterStatus.value)) return false

      if (keyword) {
        const title = String(item.title || '').toLowerCase()
        const category = String(item.category || '').toLowerCase()
        const location = String(item.location || '').toLowerCase()
        if (!title.includes(keyword) && !category.includes(keyword) && !location.includes(keyword)) return false
      }

      if (daysRange) {
        const created = new Date(item.CreatedAt || item.created_at || item.time || '').getTime()
        if (!created || Number.isNaN(created)) return false
        const diffDays = Math.floor((now - created) / (24 * 3600 * 1000))
        if (diffDays < daysRange.min) return false
        if (daysRange.max !== null && diffDays >= daysRange.max) return false
      }

      return true
    })

    total.value = filtered.length
    const start = (currentPage.value - 1) * pageSize.value
    itemList.value = filtered.slice(start, start + pageSize.value)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '获取物品列表失败'
    ElMessage.error(errMsg)
    itemList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchItemList()
}

async function applyFilter(key: 'type' | 'campus' | 'status' | 'time' | 'category', value: string) {
  const currentMap: Record<'type' | 'campus' | 'status' | 'time' | 'category', string> = {
    type: filterType.value,
    campus: filterCampus.value,
    status: filterStatus.value,
    time: filterTime.value,
    category: filterCategory.value,
  }
  if (currentMap[key] === value) return

  if (key === 'type') filterType.value = value
  if (key === 'campus') filterCampus.value = value
  if (key === 'status') filterStatus.value = value
  if (key === 'time') filterTime.value = value
  if (key === 'category') filterCategory.value = value

  currentPage.value = 1
  switching.value = true
  itemList.value = []
  await fetchItemList()
  requestAnimationFrame(() => {
    switching.value = false
  })
}

function parseTimeRange(val: string): { min: number; max: number | null } | null {
  if (!val) return null
  if (val === '0-3') return { min: 0, max: 3 }
  if (val === '3-7') return { min: 3, max: 7 }
  if (val === '7-15') return { min: 7, max: 15 }
  if (val === '15-30') return { min: 15, max: 30 }
  if (val === '30+') return { min: 30, max: null }
  return null
}

function matchPostType(item: any, filterTypeValue: string) {
  if (!filterTypeValue) return true
  const lf = Number(item?.lost_or_found)
  const type = String(item?.type || '').toLowerCase()
  if (filterTypeValue === '1') return lf === 1 || type === 'lost'
  if (filterTypeValue === '2') return lf === 2 || type === 'found'
  return true
}

function getBountyText(item: any) {
  const value = Number(item?.bounty ?? item?.reward ?? 0)
  if (!Number.isFinite(value) || value < 0) return '0元'
  return `${value}元`
}

function normalizeEditableStatus(status: unknown) {
  const value = String(status || '').toLowerCase()
  if (['approved', 'archived', 'matched', 'cancelled'].includes(value)) return value
  return 'approved'
}

function showItemDetail(item: any) {
  currentItem.value = { ...item }
  editMode.value = 'view'
  editStatus.value = normalizeEditableStatus(item.status)
  handleNote.value = ''
  editForm.title = item.title || ''
  editForm.campus = item.campus || campusOptions[0]
  editForm.location = item.location || ''
  editForm.category = item.category || categoryOptions[0]
  editForm.bounty = Number(item.bounty ?? item.reward ?? 0) || 0
  editForm.time = item.time || ''
  editForm.description = item.description || ''
  editForm.contact_name = item.contact_name || ''
  editForm.contact_phone = item.contact_phone || ''
  detailVisible.value = true
}

async function handleSaveInfo() {
  if (saveLoading.value) return
  if (!canEditCurrentItem.value) {
    ElMessage.warning('仅招领帖可修改信息')
    editMode.value = 'view'
    return
  }
  try {
    await ElMessageBox.confirm('确定要保存修改的信息吗？', '确认', { type: 'warning' })
    saveLoading.value = true
    const id = currentItem.value.id ?? currentItem.value.ID

    const data: Record<string, any> = {}
    if (editForm.title !== (currentItem.value.title || '')) data.title = editForm.title
    if (editForm.campus !== (currentItem.value.campus || '')) data.campus = editForm.campus
    if (editForm.location !== (currentItem.value.location || '')) data.location = editForm.location
    if (editForm.category !== (currentItem.value.category || '')) data.category = editForm.category
    const currentBounty = Number(currentItem.value.bounty ?? currentItem.value.reward ?? 0) || 0
    if (Number(editForm.bounty) !== currentBounty) data.bounty = Number(editForm.bounty)
    if (editForm.time !== (currentItem.value.time || '')) data.time = editForm.time
    if (editForm.description !== (currentItem.value.description || '')) data.description = editForm.description
    if (editForm.contact_name !== (currentItem.value.contact_name || '')) data.contact_name = editForm.contact_name
    if (editForm.contact_phone !== (currentItem.value.contact_phone || '')) data.contact_phone = editForm.contact_phone

    if (Object.keys(data).length === 0) {
      ElMessage.info('没有修改任何内容')
      return
    }

    const res = await updateItem(id, data)
    const code = Number((res as any)?.data?.code ?? 200)
    if (code !== 200) {
      throw new Error(String((res as any)?.data?.msg || '更新失败'))
    }
    ElMessage.success('信息更新成功')
    detailVisible.value = false
    fetchItemList()
  } catch (error: unknown) {
    if (error === 'cancel' || error === 'close') return
    const errMsg = error instanceof Error ? error.message : '更新失败'
    ElMessage.error(errMsg)
  } finally {
    saveLoading.value = false
  }
}

async function handleSaveStatus(options?: { skipConfirm?: boolean }) {
  if (saveLoading.value) return
  if (!canEditCurrentItem.value) {
    ElMessage.warning('仅招领帖可修改状态')
    editMode.value = 'view'
    return
  }
  try {
    const id = currentItem.value.id ?? currentItem.value.ID
    const statusLabel =
      editStatus.value === 'archived'
        ? '归档'
        : editStatus.value === 'matched'
          ? '标记为已匹配'
          : '标记为无效'

    if (!options?.skipConfirm) {
      await ElMessageBox.confirm(`确定要将该帖子${statusLabel}吗？`, '确认操作', { type: 'warning' })
    }

    saveLoading.value = true
    if (editStatus.value === 'claimed') {
      ElMessage.warning('“已认领”需由发布者确认认领后自动流转，管理员不可手动设置')
      return
    }
    if (editStatus.value === 'archived') {
      const res = await archiveItem(id, { process_method: handleNote.value || '管理员归档' })
      const code = Number((res as any)?.data?.code ?? 200)
      if (code !== 200) {
        throw new Error(String((res as any)?.data?.msg || '更新失败'))
      }
    } else {
      if (editStatus.value === 'matched') {
        ElMessage.warning('“已匹配”请在认领申请审核通过后自动流转，物品管理不支持手动设置')
        return
      }
      const res = await updateItem(id, { status: editStatus.value, process_method: handleNote.value })
      const code = Number((res as any)?.data?.code ?? 200)
      if (code !== 200) {
        throw new Error(String((res as any)?.data?.msg || '更新失败'))
      }
    }
    ElMessage.success('状态更新成功')
    detailVisible.value = false
    fetchItemList()
  } catch (error: unknown) {
    if (error === 'cancel' || error === 'close') return
    const errMsg = error instanceof Error ? error.message : '更新失败'
    ElMessage.error(errMsg)
  } finally {
    saveLoading.value = false
  }
}

function handleStatusSelectChange(val: string) {
  if (val !== 'matched') return
  if (!currentItem.value) return
  ElMessage.warning('“已匹配”由认领审核通过自动变更，不能在这里手动设置')
  editStatus.value = normalizeEditableStatus(currentItem.value.status)
}

function resetDetail() {
  currentItem.value = null
  editMode.value = 'view'
  editStatus.value = 'archived'
  handleNote.value = ''
}

onMounted(() => {
  fetchItemList()
})
</script>

<style scoped>
.item-page { padding: 0; }

.search-bar { display: flex; justify-content: center; gap: 12px; margin-bottom: 20px; }
.search-input { width: 400px; }

.batch-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fef0c7;
  border-radius: 8px;
  margin-bottom: 16px;
}

.batch-count {
  font-size: 14px;
  color: #666;
  margin-right: auto;
}

.filter-illustration-section {
  position: relative;
  padding-right: 360px;
  margin-bottom: 20px;
}
.filter-area { flex: 1; min-width: 0; }
.filter-groups { flex: 1; }
.filter-row { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.filter-illustration {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 340px;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  overflow: hidden;
}
.filter-illustration img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.list-shell {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.list-shell.is-switching {
  opacity: 0;
  transform: translateY(6px);
}

.item-card {
  background: #fff;
  border: 2px solid #f5d4a0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 360px;
}

.item-card:hover { box-shadow: 0 4px 16px rgba(230, 162, 60, 0.2); }

.item-card.card-selected {
  border-color: #e6a23c;
  background: #fef9f0;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.3);
}

.card-checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.card-body { display: flex; justify-content: space-between; align-items: flex-start; }
.card-info p { margin: 4px 0; font-size: 14px; color: #333; }
.card-title { font-weight: bold; }

.card-tags { display: flex; gap: 8px; margin: 10px 0; flex-wrap: wrap; }
.tag-item { display: flex; align-items: center; gap: 4px; }
.tag-dot { width: 8px; height: 8px; border-radius: 50%; }
.tag-dot.blue { background: #409eff; }
.tag-dot.orange { background: #e6a23c; }
.tag-dot.yellow { background: #f5c242; }
.tag-dot.green { background: #67c23a; }
.tag-dot.gray { background: #909399; }
.tag-dot.purple { background: #8b5cf6; }

.card-images { display: flex; gap: 8px; min-height: 90px; }
.card-img { width: 120px; height: 90px; border-radius: 6px; background: #f5f5f5; }
.card-img-placeholder { width: 120px; height: 90px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border-radius: 6px; }

.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; }
.card-date { font-size: 12px; color: #999; }
.card-status { font-size: 13px; font-weight: bold; }
.status-pass { color: #e6a23c; }
.status-match { color: #409eff; }
.status-claim { color: #67c23a; }
.status-default { color: #999; }

.empty-state { grid-column: 1 / -1; padding: 60px 0; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 24px; }

.item-detail { padding: 0 8px; }
.detail-mode-bar { margin-bottom: 20px; }
.edit-tip { margin: 10px 2px 0; font-size: 13px; color: #67c23a; }
.edit-tip.edit-tip-disabled { color: #909399; }
.detail-top { display: flex; justify-content: space-between; }
.detail-info p { margin: 8px 0; font-size: 15px; color: #333; }
.detail-tags { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
.detail-images { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
.detail-img { width: 100%; height: 200px; border-radius: 8px; background: #f5f5f5; }

.status-change-row { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
.status-label { background: #fef0c7; padding: 4px 12px; border-radius: 4px; font-size: 14px; color: #333; }

.handle-area { margin: 16px 0; }
.handle-label { font-size: 14px; color: #666; margin-bottom: 8px; }
.detail-time { text-align: center; color: #999; font-size: 13px; margin-top: 12px; }

.edit-form { margin-top: 8px; }

@media (max-width: 1200px) {
  .filter-illustration-section {
    padding-right: 0;
    gap: 12px;
    display: flex;
    flex-direction: column;
  }

  .filter-illustration {
    position: static;
    width: 100%;
    height: 180px;
    justify-content: flex-end;
  }

  .filter-illustration img {
    width: 180px;
    height: 100%;
    object-fit: contain;
  }
}
</style>

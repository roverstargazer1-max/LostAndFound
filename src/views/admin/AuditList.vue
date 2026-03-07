<template>
  <div class="audit-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-left">
        <h2 class="page-title">审核管理</h2>
        <div class="audit-tabs">
          <el-button type="warning" plain size="small" round>帖子审核</el-button>
          <el-button size="small" round @click="router.push('/admin/claim-audit')">认领申请审核</el-button>
        </div>
      </div>
      <el-button type="warning" size="large" round @click="router.push('/admin/audit-history')">审核记录</el-button>
    </div>

    <div class="audit-hint">
      帖子审核只处理失物/招领帖是否通过；认领申请审核处理认领请求。认领请求通过后，需发布者确认才会变为已认领。
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <el-table
        :data="auditList"
        v-loading="loading"
        stripe
        :header-cell-style="{ background: '#fdf6ec', color: '#333', fontWeight: 'bold' }"
        @row-click="handleRowClick"
        style="width: 100%"
      >
        <el-table-column label="索引" width="70" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="发帖类型" width="100" align="center">
          <template #default="{ row }">
            {{ getPostTypeLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column label="物品名称" width="100" align="center">
          <template #default="{ row }">
            {{ row.category || row.title || '--' }}
          </template>
        </el-table-column>
        <el-table-column label="图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.img1"
              :src="row.img1"
              fit="cover"
              @click.stop
              style="width: 60px; height: 60px; border-radius: 4px;"
            />
            <div v-else class="img-placeholder">
              无图片
            </div>
          </template>
        </el-table-column>
        <el-table-column label="拾取/丢失时间" width="160" align="center">
          <template #default="{ row }">{{ row.time || '--' }}</template>
        </el-table-column>
        <el-table-column label="拾取/丢失地点" width="120" align="center">
          <template #default="{ row }">{{ row.location || '--' }}</template>
        </el-table-column>
        <el-table-column label="拾取/丢失物品描述" min-width="180">
          <template #default="{ row }">
            <span class="desc-text">{{ row.description || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button class="op-btn" type="warning" round size="small" :disabled="submitLoading" @click.stop="openReject(row)">驳回</el-button>
              <el-button class="op-btn" type="warning" round size="small" :loading="submitLoading && submittingAction === 'approve'" @click.stop="handleApprove(row)">通过</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchPendingList"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" width="700px" :show-close="true" top="8vh" :close-on-click-modal="true">
      <div class="detail-dialog" v-if="currentItem">
        <div class="detail-header">
          <div class="detail-info">
            <p><strong>物品名称：</strong>{{ currentItem.title || currentItem.category }}</p>
            <p><strong>{{ isLostPost(currentItem) ? '丢失' : '拾取' }}时间：</strong>{{ currentItem.time || '--' }}</p>
            <p><strong>{{ isLostPost(currentItem) ? '丢失' : '拾取' }}地点：</strong>{{ currentItem.location || '--' }}</p>
            <p><strong>联系方式：</strong>{{ currentItem.contact_phone || currentItem.contact || '你没有权限知道' }}</p>
            <p><strong>联系人：</strong>{{ currentItem.contact_name || currentItem.name || '你没有权限知道' }}</p>
            <p><strong>物品特征：</strong>{{ currentItem.description || '--' }}</p>
          </div>
        </div>

        <!-- 标签 -->
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
        </div>

        <!-- 图片 -->
        <div class="detail-images">
          <el-image
            v-for="(img, idx) in [currentItem.img1, currentItem.img2, currentItem.img3, currentItem.img4].filter(Boolean)"
            :key="idx"
            :src="img"
            fit="cover"
            class="detail-img"
            :preview-src-list="[currentItem.img1, currentItem.img2, currentItem.img3, currentItem.img4].filter(Boolean)"
          />
          <div v-if="![currentItem.img1, currentItem.img2, currentItem.img3, currentItem.img4].filter(Boolean).length" class="no-img">暂无图片</div>
        </div>

        <div class="detail-actions-bottom">
          <el-button class="detail-action-btn" type="warning" :disabled="submitLoading" @click="openReject(currentItem)">驳回</el-button>
          <el-button
            class="detail-action-btn"
            type="warning"
            :loading="submitLoading && submittingAction === 'approve'"
            :disabled="submitLoading && submittingAction !== 'approve'"
            @click="handleApprove(currentItem)"
          >通过</el-button>
        </div>

        <p class="detail-time">{{ currentItem.CreatedAt ? new Date(currentItem.CreatedAt).toLocaleString('zh-CN') : '' }}发布</p>
      </div>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectVisible" title="填写驳回原因" width="450px" top="20vh">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入驳回原因"
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button :disabled="submitLoading" @click="rejectVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading && submittingAction === 'reject'" @click="handleReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 页面注释：AuditList 页面的状态管理、交互处理与接口调用逻辑。
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getPendingItems, approveItem, rejectItem } from '@/api/admin'
import { useAuditHistoryStore } from '@/stores/auditHistory'
import { normalizeResourceUrl } from '@/utils/url'

const router = useRouter()
const auditHistoryStore = useAuditHistoryStore()
const loading = ref(false)
const auditList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailVisible = ref(false)
const currentItem = ref<any>(null)
const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectingItem = ref<any>(null)
const submitLoading = ref(false)
const submittingAction = ref<'approve' | 'reject' | ''>('')

async function fetchPendingList() {
  loading.value = true
  try {
    const res = await getPendingItems({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    const resData = res.data?.data ?? res.data ?? {}
    const list = normalizeList(resData)
    const normalized = list.map(normalizeItem)
    const primaryTotal = Number(resData.total ?? normalized.length ?? 0)

    auditList.value = normalized
    total.value = primaryTotal
    window.dispatchEvent(new CustomEvent('admin-pending-refresh'))
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '获取待审核列表失败'
    ElMessage.error(errMsg)
    auditList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data?.list)) return data.data.list
  if (Array.isArray(data?.data?.items)) return data.data.items
  return []
}

function normalizeItem(item: any) {
  return {
    ...item,
    id: item.id ?? item.ID,
    img1: normalizeResourceUrl(item.img1),
    img2: normalizeResourceUrl(item.img2),
    img3: normalizeResourceUrl(item.img3),
    img4: normalizeResourceUrl(item.img4),
  }
}

function getPostTypeLabel(row: any) {
  const t = String(row?.type ?? '').toLowerCase()
  if (t === 'lost') return '失物帖'
  if (t === 'found') return '招领帖'
  const lf = Number(row?.lost_or_found)
  if (lf === 1) return '失物帖'
  if (lf === 2) return '招领帖'
  return '--'
}

function isLostPost(row: any) {
  const t = String(row?.type ?? '').toLowerCase()
  if (t === 'lost') return true
  if (t === 'found') return false
  return Number(row?.lost_or_found) === 1
}

function showDetail(row: any) {
  currentItem.value = row
  detailVisible.value = true
}

function handleRowClick(row: any) {
  showDetail(row)
}

function getBountyText(item: any) {
  const value = Number(item?.bounty ?? item?.reward ?? 0)
  if (!Number.isFinite(value) || value < 0) return '0元'
  return `${value}元`
}

function openReject(row: any) {
  rejectingItem.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}

async function handleApprove(row: any) {
  if (submitLoading.value) return
  try {
    await ElMessageBox.confirm('确定通过该帖子的审核？', '确认')
    submitLoading.value = true
    submittingAction.value = 'approve'
    await approveItem(row.id ?? row.ID)
    auditHistoryStore.addRecord(row, 'approved', undefined, 'item')
    ElMessage.success('审核通过')
    detailVisible.value = false
    await fetchPendingList()
    window.dispatchEvent(new CustomEvent('admin-pending-refresh'))
  } catch (error: unknown) {
    if (error === 'cancel' || error === 'close') return
    const errMsg = error instanceof Error ? error.message : '审核失败'
    ElMessage.error(errMsg)
  } finally {
    submitLoading.value = false
    submittingAction.value = ''
  }
}

async function handleReject() {
  if (submitLoading.value) return
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  try {
    submitLoading.value = true
    submittingAction.value = 'reject'
    const id = rejectingItem.value.id ?? rejectingItem.value.ID
    await rejectItem(id, { reject_reason: rejectReason.value })
    auditHistoryStore.addRecord(rejectingItem.value, 'rejected', rejectReason.value, 'item')
    ElMessage.success('已驳回')
    rejectVisible.value = false
    rejectReason.value = ''
    detailVisible.value = false
    await fetchPendingList()
    window.dispatchEvent(new CustomEvent('admin-pending-refresh'))
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '驳回失败'
    ElMessage.error(errMsg)
  } finally {
    submitLoading.value = false
    submittingAction.value = ''
  }
}

onMounted(() => {
  fetchPendingList()
})
</script>

<style scoped>
.audit-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.audit-tabs {
  display: flex;
  gap: 8px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.audit-hint {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff7e6;
  color: #8c6d1f;
  font-size: 13px;
  line-height: 1.6;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.table-wrapper :deep(.el-table__row) {
  cursor: pointer;
}

.img-placeholder {
  width: 60px;
  height: 60px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin: 0 auto;
  color: #999;
  font-size: 12px;
}

.desc-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13px;
  color: #666;
}

.action-btns {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.op-btn {
  width: 56px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 璇︽儏寮圭獥 */
.detail-dialog {
  padding: 0 8px;
}

.detail-header {
  display: flex;
  justify-content: flex-start;
}

.detail-info p {
  margin: 8px 0;
  font-size: 15px;
  color: #333;
}

.detail-info p strong {
  color: #333;
}

.detail-action-btn {
  min-width: 96px;
}

.detail-actions-bottom {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

.detail-tags {
  display: flex;
  gap: 16px;
  margin: 16px 0;
  flex-wrap: wrap;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tag-dot.blue { background: #409eff; }
.tag-dot.orange { background: #e6a23c; }
.tag-dot.yellow { background: #f5c242; }

.detail-images {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 16px 0;
}

.detail-img {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  background: #f5f5f5;
}

.no-img {
  color: #999;
  text-align: center;
  padding: 40px;
  grid-column: 1 / -1;
}

.detail-time {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin-top: 12px;
}
</style>





<template>
  <div class="claim-page">
    <div class="page-header">
      <div class="page-left">
        <h2 class="page-title">审核管理</h2>
        <div class="audit-tabs">
          <el-button size="small" round @click="router.push('/admin/audit')">帖子审核</el-button>
          <el-button type="warning" plain size="small" round>认领申请审核</el-button>
        </div>
      </div>
      <el-button type="warning" size="large" round @click="router.push('/admin/audit-history')">
        审核记录
      </el-button>
    </div>

    <div class="table-wrapper">
      <el-table
        :data="claimList"
        v-loading="loading"
        stripe
        :header-cell-style="{ background: '#fdf6ec', color: '#333', fontWeight: 'bold' }"
        style="width: 100%"
      >
        <el-table-column label="索引" width="70" align="center">
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="申请类型" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="getClaimTypeTag(row)" round>
              {{ getClaimTypeLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="申请时间" width="170" align="center">
          <template #default="{ row }">
            {{ row.CreatedAt ? new Date(row.CreatedAt).toLocaleString('zh-CN') : '--' }}
          </template>
        </el-table-column>

        <el-table-column label="物品名称" width="140" align="center">
          <template #default="{ row }">
            {{ row.item?.title || row.item?.category || row.category || '--' }}
          </template>
        </el-table-column>

        <el-table-column label="图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="getPostImages(row)[0]"
              :src="getPostImages(row)[0]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px;"
            />
            <span v-else class="no-image">无图片</span>
          </template>
        </el-table-column>

        <el-table-column label="申请内容" min-width="260">
          <template #default="{ row }">
            <span class="desc-text">{{ getClaimSpeech(row) || '--' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="warning" round size="small" @click="showClaimDetail(row)">详情</el-button>
              <el-button type="warning" round size="small" plain @click="openClaimReject(row)">驳回</el-button>
              <el-button type="warning" round size="small" @click="handleClaimApprove(row)">通过</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchClaimList"
      />
    </div>

    <el-dialog v-model="detailVisible" width="700px" :show-close="true" top="8vh" @closed="resetDialog">
      <div class="claim-detail" v-if="currentClaim">
        <h2 class="claim-detail-title">认领申请详情</h2>

        <div class="item-info-card">
          <h4 class="section-title">原帖信息</h4>
          <p>
            <strong>申请类型：</strong>
            <el-tag :type="getClaimTypeTag(currentClaim)" round>
              {{ getClaimTypeLabel(currentClaim) }}
            </el-tag>
            <span class="type-hint">{{ getClaimTypeHint(currentClaim) }}</span>
          </p>
          <p><strong>物品名称：</strong>{{ currentClaim.item?.title || currentClaim.item?.category || '--' }}</p>
          <p><strong>物品类型：</strong>{{ currentClaim.item?.category || '--' }}</p>
          <p><strong>{{ isLostPost(currentClaim.item) ? '丢失地点' : '拾取地点' }}：</strong>{{ currentClaim.item?.location || '--' }}</p>
          <p><strong>{{ isLostPost(currentClaim.item) ? '丢失时间' : '拾取时间' }}：</strong>{{ currentClaim.item?.time || '--' }}</p>
          <p><strong>物品描述：</strong>{{ currentClaim.item?.description || '--' }}</p>
        </div>

        <div class="claim-images" v-if="getPostImages(currentClaim).length > 0">
          <el-image
            v-for="(img, idx) in getPostImages(currentClaim)"
            :key="`post-${idx}`"
            :src="img"
            fit="cover"
            class="claim-img"
            :preview-src-list="getPostImages(currentClaim)"
          />
        </div>
        <p v-else class="empty-hint">原帖无图片</p>

        <div class="item-info-card">
          <h4 class="section-title">认领人材料</h4>
          <p><strong>申请人：</strong>{{ currentClaim.claimant?.username || currentClaim.claimant?.name || '--' }}</p>
          <p><strong>申请说明：</strong>{{ getClaimSpeech(currentClaim) || '--' }}</p>
        </div>

        <div class="claim-images" v-if="getApplicantImages(currentClaim).length > 0">
          <el-image
            v-for="(img, idx) in getApplicantImages(currentClaim)"
            :key="`claim-${idx}`"
            :src="img"
            fit="cover"
            class="claim-img"
            :preview-src-list="getApplicantImages(currentClaim)"
          />
        </div>
        <p v-else class="empty-hint">认领人未上传图片</p>


        <div v-if="showRejectInput" class="reject-input-area">
          <h4>填写驳回原因</h4>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请输入驳回原因"
            maxlength="200"
            show-word-limit
          />
        </div>

        <div class="claim-detail-footer">
          <el-button
            :type="showRejectInput ? 'info' : 'warning'"
            :loading="rejectLoading"
            @click="handleClaimRejectConfirm"
          >驳回</el-button>
          <el-button
            :type="showRejectInput ? 'info' : 'warning'"
            :loading="approveLoading"
            @click="handleClaimApprove(currentClaim)"
            :disabled="showRejectInput"
          >通过</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 页面注释：ClaimAudit 页面的状态管理、交互处理与接口调用逻辑。
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingClaims, approveClaim, rejectClaim } from '@/api/admin'
import { useAuditHistoryStore } from '@/stores/auditHistory'
import { normalizeResourceUrl } from '@/utils/url'

const router = useRouter()
const auditHistoryStore = useAuditHistoryStore()

const loading = ref(false)
const approveLoading = ref(false)
const rejectLoading = ref(false)
const claimList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailVisible = ref(false)
const currentClaim = ref<any>(null)
const showRejectInput = ref(false)
const rejectReason = ref('')

function expandImageValue(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap(expandImageValue)
  if (typeof value !== 'string') return []

  const trimmed = value.trim()
  if (!trimmed) return []

  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return expandImageValue(JSON.parse(trimmed))
    } catch {
    }
  }

  if (trimmed.includes(',')) {
    return trimmed.split(',').map((v) => v.trim()).filter(Boolean)
  }

  return [trimmed]
}

function isLikelyImageUrl(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (!v) return false
  if (v.startsWith('data:image/')) return true
  if (v.startsWith('blob:')) return true
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('//')) {
    return /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|#|$)/i.test(v) || /\/uploads?\//i.test(v) || /\/images?\//i.test(v)
  }
  if (v.startsWith('/')) {
    return /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|#|$)/i.test(v) || /\/uploads?\//i.test(v) || /\/images?\//i.test(v)
  }
  // 相对路径必须带目录或扩展名，避免把“有图片/12213”当成图片地址
  return /[\\/]/.test(v) || /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|#|$)/i.test(v)
}

function normalizeImages(list: any[]): string[] {
  const flat = list.flatMap(expandImageValue)
  const cleaned = flat
    .map((v) => normalizeResourceUrl(v))
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => isLikelyImageUrl(v))
    .filter((v) => v.length > 0)
  return Array.from(new Set(cleaned))
}

function hasImageValue(value: any): boolean {
  return expandImageValue(value).some((v) => isLikelyImageUrl(String(v || '')))
}

function collectImageFields(source: any, depth = 0): any[] {
  if (!source || depth > 2) return []
  const out: any[] = []
  if (Array.isArray(source)) {
    for (const item of source) out.push(...collectImageFields(item, depth + 1))
    return out
  }
  if (typeof source !== 'object') return out

  for (const [key, value] of Object.entries(source)) {
    if (key === 'item') continue
    if (/(img|image|photo|picture|attachment|voucher)/i.test(key)) {
      out.push(value)
    }
    if (value && typeof value === 'object') {
      out.push(...collectImageFields(value, depth + 1))
    }
  }
  return out
}

function getPostImages(claim: any): string[] {
  const item = claim?.item || {}
  return normalizeImages([
    item.img1, item.img2, item.img3, item.img4,
    item.images, item.image_list, item.photos,
    ...collectImageFields(item)
  ])
}

function getApplicantImages(claim: any): string[] {
  const c = claim || {}
  const postImages = new Set(getPostImages(claim))
  const all = normalizeImages([
    c.img1, c.img2, c.img3, c.img4,
    c.claim_img1, c.claim_img2, c.claim_img3, c.claim_img4,
    c.proof_img1, c.proof_img2, c.proof_img3, c.proof_img4,
    c.claim_images, c.proof_images, c.images, c.image_list, c.photos,
    c.proof_url, c.file_url, c.url, c.path,
    c.proof, c.claim_proof,
    ...collectImageFields(c)
  ])
  const filtered = all.filter((img) => !postImages.has(img))
  return filtered.length > 0 ? filtered : all
}

function getClaimSpeech(claim: any): string {
  const candidates = [
    claim?.proof,
    claim?.claim_proof,
    claim?.claim_reason,
    claim?.apply_reason,
    claim?.content,
    claim?.message,
    claim?.reason,
    claim?.description,
    claim?.remark,
    claim?.item?.proof,
    claim?.item?.claim_proof,
    claim?.item?.claim_reason,
    claim?.item?.apply_reason,
    claim?.item?.content,
    claim?.item?.message,
    claim?.item?.reason,
    claim?.item?.remark,
  ]
  const hit = candidates.find((v) => {
    if (typeof v !== 'string') return false
    const text = v.trim()
    if (!text) return false
    return !hasImageValue(text)
  })
  return String(hit || '').trim()
}

function isLostPost(item: any): boolean {
  const type = String(item?.type || '').toLowerCase()
  if (type === 'lost') return true
  if (type === 'found') return false
  return Number(item?.lost_or_found) === 1
}

function getClaimTypeLabel(row: any): string {
  return isLostPost(row?.item) ? '归还申请' : '认领申请'
}

function getClaimTypeTag(row: any): 'success' | 'warning' {
  return isLostPost(row?.item) ? 'success' : 'warning'
}

function getClaimTypeHint(row: any): string {
  if (isLostPost(row?.item)) return '申请人表示自己捡到物品，准备归还给失主。'
  return '申请人表示该物品属于自己，正在申请认领。'
}

function resetDialog() {
  showRejectInput.value = false
  rejectReason.value = ''
  currentClaim.value = null
}

async function fetchClaimList() {
  loading.value = true
  try {
    const res = await getPendingClaims({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    const resData = res.data?.data ?? res.data ?? {}
    claimList.value = (resData.list ?? resData.items ?? []).map((item: any) => ({
      ...item,
      id: item.id ?? item.ID,
    }))
    total.value = resData.total ?? 0
    window.dispatchEvent(new CustomEvent('admin-pending-refresh'))
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '获取认领列表失败'
    ElMessage.error(errMsg)
    claimList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function showClaimDetail(row: any) {
  currentClaim.value = row
  showRejectInput.value = false
  rejectReason.value = ''
  detailVisible.value = true
}

function openClaimReject(row: any) {
  currentClaim.value = row
  rejectReason.value = ''
  showRejectInput.value = false
  detailVisible.value = true
  setTimeout(() => { showRejectInput.value = true }, 100)
}

function buildHistoryItemFromClaim(claimRow: any) {
  const item = claimRow?.item || claimRow || {}
  return {
    ...item,
    _claim_proof: getClaimSpeech(claimRow),
  }
}

function handleClaimRejectConfirm() {
  if (!showRejectInput.value) {
    showRejectInput.value = true
    return
  }
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  doRejectClaim()
}

async function doRejectClaim() {
  if (rejectLoading.value) return
  rejectLoading.value = true
  try {
    const id = currentClaim.value.id ?? currentClaim.value.ID
    const res = await rejectClaim(id, { reject_reason: rejectReason.value })
    const code = Number((res as any)?.data?.code ?? 200)
    if (code !== 200) {
      throw new Error(String((res as any)?.data?.msg || '驳回失败'))
    }
    auditHistoryStore.addRecord(buildHistoryItemFromClaim(currentClaim.value), 'rejected', rejectReason.value, 'claim')
    ElMessage.success('已驳回')
    detailVisible.value = false
    showRejectInput.value = false
    rejectReason.value = ''
    await fetchClaimList()
    window.dispatchEvent(new CustomEvent('admin-pending-refresh'))
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '驳回失败'
    ElMessage.error(errMsg)
  } finally {
    rejectLoading.value = false
  }
}

async function handleClaimApprove(row: any) {
  if (approveLoading.value) return
  try {
    await ElMessageBox.confirm('确定通过该认领申请？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    approveLoading.value = true
    const id = row.id ?? row.ID
    const res = await approveClaim(id)
    const code = Number((res as any)?.data?.code ?? 200)
    if (code !== 200) {
      throw new Error(String((res as any)?.data?.msg || '审核失败'))
    }
    auditHistoryStore.addRecord(buildHistoryItemFromClaim(row), 'approved', undefined, 'claim')
    ElMessage.success('认领申请审核通过')
    detailVisible.value = false
    await fetchClaimList()
    window.dispatchEvent(new CustomEvent('admin-pending-refresh'))
  } catch (error: unknown) {
    if (error === 'cancel' || error === 'close') return
    const errMsg = error instanceof Error ? error.message : '审核失败'
    ElMessage.error(errMsg)
  } finally {
    approveLoading.value = false
  }
}

onMounted(() => {
  fetchClaimList()
})
</script>

<style scoped>
.claim-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
.page-left { display: flex; align-items: center; gap: 14px; }
.audit-tabs { display: flex; gap: 8px; }
.table-wrapper { background: #fff; border-radius: 8px; overflow: hidden; }
.no-image { color: #999; font-size: 13px; }
.desc-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; color: #666; }
.action-btns { display: flex; gap: 6px; justify-content: center; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 24px; }
.claim-detail { padding: 0 8px; }
.claim-detail-title { font-size: 22px; font-weight: bold; color: #333; margin: 0 0 16px; }
.item-info-card { background: #fef8ee; border-radius: 8px; padding: 16px 20px; }
.item-info-card p { margin: 8px 0; font-size: 14px; color: #333; line-height: 1.8; }
.section-title { margin: 0 0 8px; font-size: 15px; color: #333; font-weight: 700; }
.type-hint { color: #999; margin-left: 8px; font-size: 13px; }
.claim-images { display: flex; gap: 12px; justify-content: center; margin: 16px 0; }
.claim-img { width: 160px; height: 140px; border-radius: 8px; background: #f5f5f5; }
.empty-hint { text-align: center; color: #999; font-size: 13px; margin: 8px 0 16px; }
.reject-input-area { margin: 16px 0; background: #f9f9f9; padding: 16px; border-radius: 8px; }
.reject-input-area h4 { margin: 0 0 10px; font-size: 15px; color: #333; }
.claim-detail-footer { display: flex; justify-content: center; gap: 16px; margin-top: 20px; padding-bottom: 8px; }
</style>





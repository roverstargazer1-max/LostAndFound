<template>
  <div class="progress-page" v-loading="loading">
    <el-empty v-if="!loading && progressList.length === 0" description="暂无招领进度" />

    <div v-else class="progress-list">
      <div v-for="item in progressList" :key="`${item.claim_id || 0}-${item.time || ''}`" class="progress-row">
        <div class="progress-left">系统</div>

        <div class="progress-right">
          <div class="progress-card">
            <div class="notice-title" :class="{ rejected: isRejected(item) }">{{ getNoticeTitle(item) }}</div>
            <div v-if="getNoticeHint(item)" class="notice-hint" :class="{ rejected: isRejected(item) }">{{ getNoticeHint(item) }}</div>

            <el-button
              v-if="getActionText(item)"
              type="primary"
              class="action-btn"
              round
              @click="handleAction(item)"
            >
              {{ getActionText(item) }}
            </el-button>

            <div class="item-card">
              <div class="item-content">
                <div class="item-meta">
                  <p><strong>物品名称：</strong>{{ item.item_name || '-' }}</p>
                  <p><strong>丢失时间：</strong>{{ formatLossTime(item.loss_time) }}</p>
                  <p><strong>丢失地点：</strong>{{ item.location || '-' }}</p>
                </div>
                <el-image
                  v-if="item.img"
                  :src="normalizeResourceUrl(item.img)"
                  fit="cover"
                  class="item-image"
                >
                  <template #error>
                    <div class="img-fallback">暂无图片</div>
                  </template>
                </el-image>
              </div>
              <button class="more-btn" type="button" @click="handleMore(item)">···</button>
            </div>
          </div>

          <div class="time-line">{{ formatTimeline(item.time) }}</div>
        </div>
      </div>
    </div>

    <div class="pager" v-if="total > pageSize">
      <el-pagination
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="pageNum"
        @current-change="handlePageChange"
      />
    </div>
    <ItemDetailDialog
      v-model="showDetailDialog"
      :item="currentDetailItem"
      hide-action
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ItemDetailDialog from '@/components/ItemDetailDialog.vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getClaimProgressApi, getClaimReasonApi, type ClaimProgressItem } from '@/api/ClaimProgess'
import { getItemDetail, type Item, type RawItemFromApi } from '@/api/ResearchItems'
import { normalizeResourceUrl } from '@/utils/url'
import { useMessageNoticeStore } from '@/stores/messageNotice'
import { useChatSessionStore } from '@/stores/chatSession'

const loading = ref(false)
const progressList = ref<ClaimProgressItem[]>([])
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const router = useRouter()
const messageNoticeStore = useMessageNoticeStore()
const chatSessionStore = useChatSessionStore()

const showDetailDialog = ref(false)
const currentDetailItem = ref<Item | null>(null)

type ClaimStatusType = 'approved' | 'pending' | 'rejected' | 'unknown'

const normalizeType = (type: RawItemFromApi['type'], fallback: Item['type'] = 1): Item['type'] => {
  if (type === 'lost') return 1
  if (type === 'found') return 2
  if (type === 1 || type === 2) return type
  return fallback
}

const normalizeStatusForDetail = (status: RawItemFromApi['status'], fallback: Item['status'] = 1): Item['status'] => {
  if (status === 'pending') return 'pending'
  if (status === 'approved') return 'approved'
  if (status === 'displaying') return 1
  if (status === 'matched') return 2
  if (status === 'claimed') return 3
  if (status === 'rejected') return 'rejected'
  if (status === 'archived') return 'archived'
  if (typeof status === 'number') return status
  return fallback
}

const normalizeItemDetail = (raw: RawItemFromApi, fallback?: Item): Item => {
  const imagesFromSlots = [raw?.img1, raw?.img2, raw?.img3, raw?.img4].filter((value): value is string => Boolean(value))
  const safeFallback = fallback || ({} as Item)

  return {
    ...safeFallback,
    ...raw,
    id: raw.id ?? raw.ID ?? safeFallback.id ?? 0,
    name: raw.name || raw.title || safeFallback.name || '未命名物品',
    type: normalizeType(raw.type, safeFallback.type ?? 1),
    status: normalizeStatusForDetail(raw.status, safeFallback.status ?? 1),
    campus: raw.campus || safeFallback.campus || '',
    location: raw.location || safeFallback.location || '',
    event_time: raw.event_time || raw.time || safeFallback.event_time || '',
    cover_image: raw.cover_image || raw.img1 || safeFallback.cover_image || '',
    description: raw.description || safeFallback.description || '',
    category: raw.category || safeFallback.category,
    reward: raw.reward ?? raw.bounty ?? safeFallback.reward,
    contact_method: raw.contact_method || raw.contact_phone || safeFallback.contact_method,
    contact_person: raw.contact_person || raw.contact_name || safeFallback.contact_person,
    images: raw.images?.filter(Boolean) || (imagesFromSlots.length > 0 ? imagesFromSlots : (safeFallback.images || [])),
    img1: raw.img1 || safeFallback.img1,
    img2: raw.img2 || safeFallback.img2,
    img3: raw.img3 || safeFallback.img3,
    img4: raw.img4 || safeFallback.img4,
    time: raw.time || safeFallback.time,
    create_time: raw.create_time || raw.CreatedAt || safeFallback.create_time,
    CreatedAt: raw.CreatedAt || safeFallback.CreatedAt,
  }
}

const getClaimStatusType = (item: ClaimProgressItem): ClaimStatusType => {
  const status = String(item.claim_status || '').toLowerCase()
  if (status === 'approved') return 'approved'
  if (status === 'pending') return 'pending'
  if (status === 'rejected') return 'rejected'
  return 'unknown'
}

const getNoticeTitle = (item: ClaimProgressItem) => {
  if (item.title) return item.title
  const status = getClaimStatusType(item)
  if (status === 'approved') return '你的认领申请已通过！'
  if (status === 'pending') return '你的认领申请待审核'
  if (status === 'rejected') return '你的认领申请未通过'
  return '招领进度更新'
}

const getNoticeHint = (item: ClaimProgressItem) => {
  if (item.hint) return item.hint
  const status = getClaimStatusType(item)
  if (status === 'rejected') return '请认真填写相关细节和更多物品特征'
  return ''
}

const getActionText = (item: ClaimProgressItem) => {
  const status = getClaimStatusType(item)
  if (status === 'approved') return '点此与对方进行沟通'
  if (status === 'rejected') return '点此查看原因'
  return ''
}

const isRejected = (item: ClaimProgressItem) => {
  return getClaimStatusType(item) === 'rejected'
}

const formatLossTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const formatTimeline = (value?: string) => {
  if (!value) return '-- --:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getMonth() + 1}.${date.getDate()}   ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const fetchProgress = async () => {
  loading.value = true
  try {
    const response = await getClaimProgressApi({ page_num: pageNum.value, page_size: pageSize })
    if (Number(response?.data?.code) !== 200) {
      progressList.value = []
      total.value = 0
      ElMessage.warning(response?.data?.msg || '获取招领进度失败')
      return
    }

    const list = Array.isArray(response.data?.data?.list) ? response.data.data.list : []
    progressList.value = list
    total.value = Number(response.data?.data?.total || list.length || 0)
  } catch {
    progressList.value = []
    total.value = 0
    ElMessage.error('获取招领进度失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  fetchProgress()
}

const handleAction = async (item: ClaimProgressItem) => {
  const status = getClaimStatusType(item)
  try {
    if (status === 'rejected') {
      if (!item.claim_id) {
        ElMessage.warning('缺少认领ID，无法查看原因')
        return
      }
      const response = await getClaimReasonApi({ id: item.claim_id })
      if (Number(response?.data?.code) !== 200) {
        ElMessage.warning(response?.data?.msg || '获取原因失败')
        return
      }
      await ElMessageBox.alert(response?.data?.data?.reject_reason || '暂无原因', '原因说明', {
        confirmButtonText: '我知道了'
      })
      return
    }

    if (status === 'approved') {
      const targetId = Number(item.peer_user_id || 0)
      if (!targetId) {
        ElMessage.warning('缺少沟通对象ID，无法打开会话')
        return
      }

      chatSessionStore.ensureSession({
        target_id: targetId,
        target_name: `用户${targetId}`
      })

      router.push({
        path: `/StudentHome/message/chat/${targetId}`,
        query: {
          target_name: `用户${targetId}`,
          item_id: String(item.item_id || ''),
          item_name: item.item_name || '',
          loss_time: item.loss_time || '',
          location: item.location || '',
          img: item.img || '',
          can_confirm: '0'
        }
      })
      return
    }

    ElMessage.info('该操作暂未实现')
  } catch {
    ElMessage.error('操作失败，请稍后重试')
  }
}

const handleMore = async (item: ClaimProgressItem) => {
  const itemId = Number(item.item_id || 0)
  if (!itemId) {
    ElMessage.warning('缺少物品ID，无法查看详情')
    return
  }

  const fallbackItem: Item = {
    id: itemId,
    name: item.item_name || '未命名物品',
    type: 1,
    campus: '',
    location: item.location || '',
    event_time: item.loss_time || item.time || '',
    cover_image: item.img || '',
    status: 1,
    description: '',
    images: item.img ? [item.img] : []
  }

  try {
    const response = await getItemDetail(itemId)
    if (Number(response?.data?.code) !== 200 || !response?.data?.data) {
      currentDetailItem.value = fallbackItem
      showDetailDialog.value = true
      ElMessage.warning(response?.data?.msg || '获取详情失败，已显示基础信息')
      return
    }

    currentDetailItem.value = normalizeItemDetail(response.data.data, fallbackItem)
    showDetailDialog.value = true
  } catch {
    currentDetailItem.value = fallbackItem
    showDetailDialog.value = true
    ElMessage.warning('获取详情失败，已显示基础信息')
  }
}

onMounted(() => {
  messageNoticeStore.clearScopeUnread('claim_progress')
  fetchProgress()
})

</script>

<style scoped>
.progress-page {
  color: #fff3e4;
  padding: 12px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.progress-left {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f5a623;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.progress-right {
  flex: 1;
  min-width: 0;
}

.progress-card {
  background: #f6f6f6;
  border-radius: 4px;
  padding: 12px 14px;
}

.notice-title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #333;
  line-height: 1.35;
}

.notice-title.rejected,
.notice-hint.rejected {
  color: #f56c6c;
}

.notice-hint {
  margin-top: 2px;
  font-size: 30px;
  line-height: 1.35;
  font-weight: 600;
  color: #222;
}

.action-btn {
  margin: 10px 0 12px;
  min-width: 190px;
}

.item-card {
  background: #fff;
  border: 1px solid #f6b65f;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;
}

.item-meta p {
  margin: 0 0 2px;
  color: #333;
  font-size: 26px;
  line-height: 1.5;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  content: right;
}

.img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  background: #f5f7fa;
}

.more-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #ffe8cf;
  color: #f6b65f;
  font-weight: 700;
  cursor: pointer;
}

.time-line {
  margin-top: 6px;
  color: #444;
  font-size: 24px;
}

.pager {
  margin-top: 14px;
  display: flex;
  justify-content: center;
}

</style>

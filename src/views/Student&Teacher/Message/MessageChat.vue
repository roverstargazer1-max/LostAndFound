<template>
  <div class="chat-page" v-loading="loading">
    <div class="item-info-card">
      <template v-if="itemInfo.item_name || itemInfo.loss_time || itemInfo.location">
        <div class="item-main">
          <p><strong>物品名称：</strong>{{ itemInfo.item_name || '-' }}</p>
          <p><strong>丢失时间：</strong>{{ formatLossTime(itemInfo.loss_time) }}</p>
          <p><strong>丢失地点：</strong>{{ itemInfo.location || '-' }}</p>
        </div>
        <el-image v-if="itemInfo.img" :src="normalizeResourceUrl(itemInfo.img)" fit="cover" class="item-image" />
      </template>
      <p v-else class="item-empty">暂无关联失物信息</p>

      <el-button v-if="showConfirmButton" type="warning" round class="confirm-btn" @click="handleConfirmClaim">
        确认招领
      </el-button>
      <el-button v-else-if="sessionEnded || String(route.query.can_confirm || '') === '1'" type="success" round class="confirm-btn" disabled>
        已招领
      </el-button>
    </div>

    <div class="message-list" ref="messageListRef">
      <el-empty v-if="!loading && messages.length === 0" description="暂无聊天记录" />

      <div v-for="msg in messages" :key="msg.ID || `${msg.CreatedAt}-${msg.content}`" class="message-row" :class="{ self: isSelfMessage(msg) }">
        <el-image :src="getMessageAvatar(msg)" fit="cover" class="message-avatar" />
        <div class="message-main">
          <div class="message-name">{{ getMessageName(msg) }}</div>
          <div class="message-bubble" :class="{ 'image-bubble': isImageMessage(msg) }">
            <el-image
              v-if="isImageMessage(msg)"
              :src="getMessageImageSrc(msg)"
              fit="cover"
              class="message-image"
              :preview-src-list="[getMessageImageSrc(msg)]"
              preview-teleported
            />
            <span v-else>{{ msg.content || '[空消息]' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="sessionEnded" class="session-ended-bar">
      <span class="ended-text">你已确认招领  临时对话结束</span>
    </div>
    <div v-else class="input-bar">
      <input
        ref="imageInputRef"
        type="file"
        accept="image/*"
        class="hidden-image-input"
        @change="handleImageFileChange"
      />
      <el-input
        class="message-input"
        v-model="content"
        type="textarea"
        :rows="2"
        resize="none"
        maxlength="300"
        show-word-limit
        placeholder="请输入消息"
        @keydown.enter.exact.prevent="handleSend"
      />
      <div class="action-col">
        <el-button class="image-btn" :loading="sending" @click="triggerImageSelect">发图片</el-button>
        <el-button type="primary" class="send-btn" :loading="sending" @click="handleSend">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getChatHistory, sendMessage, signRead, type GetChatHistoryResponse } from '@/api/chat'
import { normalizeResourceUrl } from '@/utils/url'
import { uploadImagesAndGetUrls } from '@/utils/imageUpload'
import { useChatSessionStore } from '@/stores/chatSession'
import { ca, tr } from 'element-plus/es/locales.mjs'
import { confirmClaim } from '@/api/chat'
const route = useRoute()
const chatSessionStore = useChatSessionStore()

const loading = ref(false)
const sending = ref(false)
const content = ref('')
const imageInputRef = ref<HTMLInputElement | null>(null)
const messageListRef = ref<HTMLElement | null>(null)
const messages = ref<GetChatHistoryResponse['data']['list']>([])

const activeTargetId = computed(() => Number(route.params.targetId || 0))

const itemInfo = computed(() => ({
  item_id: Number(route.query.item_id || 0),
  item_name: String(route.query.item_name || ''),
  loss_time: String(route.query.loss_time || ''),
  location: String(route.query.location || ''),
  img: String(route.query.img || '')
}))

const claimConfirmed = ref(false)
const sessionEnded = ref(false)

const getSessionEndedKey = () => {
  const targetId = activeTargetId.value
  const itemId = Number(route.query.item_id || 0)
  if (!targetId) return ''
  return `chat_ended_${targetId}_${itemId}`
}

const loadSessionEndedState = () => {
  const key = getSessionEndedKey()
  if (!key) {
    sessionEnded.value = false
    return
  }
  sessionEnded.value = localStorage.getItem(key) === '1'
  claimConfirmed.value = sessionEnded.value
}

const saveSessionEnded = () => {
  const key = getSessionEndedKey()
  if (key) {
    localStorage.setItem(key, '1')
  }
  sessionEnded.value = true
}

const showConfirmButton = computed(() => String(route.query.can_confirm || '') === '1' && !claimConfirmed.value && !sessionEnded.value)

const getSelfName = () => String(localStorage.getItem('nickname') || localStorage.getItem('username') || '我')

const getSelfAvatar = () => String(localStorage.getItem('avatar') || '/头像框@7.png')

const getPeerName = () => String(route.query.target_name || `用户${activeTargetId.value}`)

const getPeerAvatar = () => {
  const matched = chatSessionStore.sessions.find((item) => item.target_id === activeTargetId.value)
  return String(matched?.avatar || '/头像框@7.png')
}

const getCurrentUserId = () => {
  const keys = ['user_id', 'userId', 'id', 'ID']
  for (const key of keys) {
    const value = Number(localStorage.getItem(key) || 0)
    if (value) return value
  }
  return 0
}

const getCurrentUsername = () => {
  return String(localStorage.getItem('username') || '')
}

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase()

const isPeerId = (id: unknown) => {
  const peerId = activeTargetId.value
  const parsed = Number(id || 0)
  return Boolean(peerId && parsed && parsed === peerId)
}

const isPeerName = (name: unknown) => {
  const peerName = normalizeText(route.query.target_name)
  const parsed = normalizeText(name)
  return Boolean(peerName && parsed && parsed === peerName)
}

const isSelfMessage = (msg: GetChatHistoryResponse['data']['list'][number]) => {
  const senderId = Number(msg.sender_id || msg.sender?.ID || 0)
  const receiverId = Number(msg.receiver_id || msg.receiver?.ID || 0)
  const senderName = normalizeText(msg.sender?.username || msg.sender?.nickname || msg.sender?.name)
  const receiverName = normalizeText(msg.receiver?.username || msg.receiver?.nickname || msg.receiver?.name)

  const currentUserId = getCurrentUserId()
  if (currentUserId) {
    if (senderId && senderId === currentUserId) return true
    if (receiverId && receiverId === currentUserId) return false
  }

  const currentUsername = getCurrentUsername()
  if (currentUsername) {
    const normalizedCurrent = normalizeText(currentUsername)
    if (senderName && senderName === normalizedCurrent) return true
    if (receiverName && receiverName === normalizedCurrent) return false
  }

  if (isPeerId(senderId)) return false
  if (isPeerId(receiverId)) return true

  if (isPeerName(senderName)) return false
  if (isPeerName(receiverName)) return true

  return false
}

const getMessageName = (msg: GetChatHistoryResponse['data']['list'][number]) => {
  if (isSelfMessage(msg)) {
    return String(msg.sender?.nickname || msg.sender?.name || msg.sender?.username || getSelfName())
  }
  return String(msg.sender?.nickname || msg.sender?.name || msg.sender?.username || getPeerName())
}

const getMessageAvatar = (msg: GetChatHistoryResponse['data']['list'][number]) => {
  if (isSelfMessage(msg)) {
    return normalizeResourceUrl(String(msg.sender?.avatar || getSelfAvatar()))
  }
  return normalizeResourceUrl(String(msg.sender?.avatar || getPeerAvatar()))
}

const isImageMessage = (msg: GetChatHistoryResponse['data']['list'][number]) => Number(msg.type || 1) === 2

const getMessageImageSrc = (msg: GetChatHistoryResponse['data']['list'][number]) => normalizeResourceUrl(String(msg.content || ''))

const formatLossTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (!messageListRef.value) return
  messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}

const resolveHistoryList = (payload: unknown): GetChatHistoryResponse['data']['list'] => {
  if (Array.isArray(payload)) return payload as GetChatHistoryResponse['data']['list']
  if (!payload || typeof payload !== 'object') return []

  const dataObj = payload as Record<string, unknown>
  if (Array.isArray(dataObj.list)) return dataObj.list as GetChatHistoryResponse['data']['list']
  if (Array.isArray(dataObj.records)) return dataObj.records as GetChatHistoryResponse['data']['list']
  if (Array.isArray(dataObj.messages)) return dataObj.messages as GetChatHistoryResponse['data']['list']
  if (Array.isArray(dataObj.items)) return dataObj.items as GetChatHistoryResponse['data']['list']
  return []
}

const normalizeSortedHistory = (list: GetChatHistoryResponse['data']['list']) => {
  const copy = [...list]
  copy.sort((left, right) => {
    const leftTime = new Date(String(left.CreatedAt || left.UpdatedAt || '')).getTime()
    const rightTime = new Date(String(right.CreatedAt || right.UpdatedAt || '')).getTime()

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime
    }

    const leftId = Number(left.ID || 0)
    const rightId = Number(right.ID || 0)
    if (leftId && rightId && leftId !== rightId) return leftId - rightId
    return 0
  })
  return copy
}

const loadHistory = async () => {
  if (!activeTargetId.value) {
    messages.value = []
    return
  }

  loading.value = true
  try {
    const response = await getChatHistory({
      target_id: activeTargetId.value,
      page_num: 1,
      page_size: 100
    })

    if (Number(response?.data?.code) !== 200) {
      messages.value = []
      ElMessage.warning(response?.data?.msg || '获取聊天记录失败')
      return
    }

    const list = resolveHistoryList(response?.data?.data)
    messages.value = normalizeSortedHistory(list)
    try {
      await signRead(activeTargetId.value)
    } catch {
    }
    await scrollToBottom()
  } catch {
    messages.value = []
    ElMessage.error('获取聊天记录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleSend = async () => {
  const targetId = activeTargetId.value
  const text = content.value.trim()
  if (!targetId) {
    ElMessage.warning('目标会话无效')
    return
  }
  if (!text) {
    ElMessage.warning('请输入消息内容')
    return
  }

  sending.value = true
  try {
    await sendMessage({
      receiver_id: targetId,
      content: text,
      type: 1,
      item_id: itemInfo.value.item_id || undefined
    })
    content.value = ''
    await loadHistory()
    await chatSessionStore.fetchSessions()
  } catch {
    ElMessage.error('发送失败，请稍后重试')
  } finally {
    sending.value = false
  }
}

const triggerImageSelect = () => {
  if (sending.value) return
  imageInputRef.value?.click()
}

const handleImageFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  const targetId = activeTargetId.value
  if (!targetId) {
    ElMessage.warning('目标会话无效')
    return
  }

  sending.value = true
  try {
    const [url] = await uploadImagesAndGetUrls([file])
    if (!url) {
      throw new Error('图片URL为空')
    }

    await sendMessage({
      receiver_id: targetId,
      content: url,
      type: 2,
      item_id: itemInfo.value.item_id || undefined
    })

    await loadHistory()
    await chatSessionStore.fetchSessions()
  } catch {
    ElMessage.error('图片发送失败，请稍后重试')
  } finally {
    sending.value = false
  }
}

const handleConfirmClaim = async () => {
  const itemId = itemInfo.value.item_id
  if (!itemId) {
    ElMessage.warning('物品信息无效，无法确认招领')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确认要认领该物品吗？此操作不可撤销。',
      '确认招领',
      {
        confirmButtonText: '确认认领',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    const response = await confirmClaim(itemId)
    if (Number(response?.data?.code) !== 200) {
      ElMessage.warning(response?.data?.msg || '确认招领失败')
      return
    }
    ElMessage.success(response?.data?.msg || '确认招领成功')
    claimConfirmed.value = true
    saveSessionEnded()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('确认招领失败，请稍后重试')
    }
  }
}
watch(
  () => route.fullPath,
  async () => {
    const targetId = activeTargetId.value
    if (targetId) {
      chatSessionStore.ensureSession({
        target_id: targetId,
        target_name: String(route.query.target_name || `用户${targetId}`)
      })
    }
    loadSessionEndedState()
    await loadHistory()
  },
  { immediate: true }
)

onMounted(async () => {
  await chatSessionStore.fetchSessions()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(100vh - 170px);
  min-height: 560px;
  overflow: hidden;
}

.item-info-card {
  border: 1px solid #f6c27d;
  border-radius: 10px;
  background: #fff;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-main p {
  margin: 0 0 4px;
  color: #333;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-empty {
  margin: 0;
  color: #999;
}

.item-image {
  width: 68px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  margin-left: auto;
  flex-shrink: 0;
}

.confirm-btn {
  flex-shrink: 0;
}

.message-list {
  flex: 1;
  background: #fdf6ec;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
}

.message-row.self {
  flex-direction: row-reverse;
  margin-left: auto;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  max-width: min(72%, 680px);
}

.message-row.self .message-main {
  align-items: flex-end;
}

.message-name {
  font-size: 12px;
  color: #8f8f8f;
}

.message-bubble {
  max-width: 100%;
  min-width: 64px;
  width: fit-content;
  background: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  color: #333;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: anywhere;
}

.message-bubble.image-bubble {
  background: transparent;
  padding: 0;
  min-width: 0;
}

.message-image {
  width: 220px;
  max-width: min(50vw, 320px);
  border-radius: 8px;
  overflow: hidden;
}

.message-row.self .message-bubble {
  background: #fef0db;
}

.message-row.self .message-bubble.image-bubble {
  background: transparent;
}

.input-bar {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  position: sticky;
  bottom: 0;
  z-index: 12;
  background: #fff;
  border-top: 1px solid #edd7b9;
  border-radius: 8px 8px 0 0;
  padding: 10px 12px;
}

.hidden-image-input {
  display: none;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea) {
  display: block;
}

.message-input :deep(.el-textarea__inner) {
  min-height: 80px;
  height: 80px;
}

.action-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
  height: 80px;
}

.action-col :deep(.el-button + .el-button) {
  margin-left: 0;
}

.image-btn {
  width: 72px;
  height: 36px;
}

.send-btn {
  width: 72px;
  height: 36px;
}

.session-ended-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -14px;
  padding: 10px 0 14px;
  background: #fdf6ec;
  border-radius: 0 0 8px 8px;
}

.ended-text {
  color: #7a7a7a;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  user-select: none;
}
</style>

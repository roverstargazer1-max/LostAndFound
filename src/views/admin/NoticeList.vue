<template>
  <div class="notice-page">
    <div class="notice-layout">
      <aside class="notice-sidebar">
        <div class="sidebar-title" @click="sidebarExpanded = !sidebarExpanded">
          <div class="title-left">
            <el-icon color="#e6a23c"><Bell /></el-icon>
            <span>公告</span>
          </div>
          <el-icon class="arrow" :class="{ folded: !sidebarExpanded }"><ArrowDown /></el-icon>
        </div>

        <div v-show="sidebarExpanded" class="sidebar-body">
          <div
            class="sidebar-item"
            :class="{ active: currentTab === 'region' }"
            @click="switchMainTab('region')"
          >
            <el-icon color="#e6a23c"><FolderOpened /></el-icon>
            <span>发布区域公告</span>
          </div>
          <div
            class="sidebar-item"
            :class="{ active: currentTab === 'system' }"
            @click="switchMainTab('system')"
          >
            <span class="dot-red" v-if="hasUnread"></span>
            <el-icon color="#666"><Flag /></el-icon>
            <span>系统公告</span>
          </div>
        </div>
      </aside>

      <div class="notice-content">
        <transition name="tab-fade" mode="out-in">
          <div :key="`${currentTab}-${regionSubTab}`">
        <div v-if="currentTab === 'region'">
          <div class="tab-header">
            <el-button :type="regionSubTab === 'history' ? 'warning' : 'default'" class="switch-btn" round @click="switchRegionSubTab('history')">
              历史区域公告
            </el-button>
            <el-button :type="regionSubTab === 'publish' ? 'warning' : 'default'" class="switch-btn" round @click="switchRegionSubTab('publish')">
              发布区域公告
            </el-button>
          </div>

          <div v-if="regionSubTab === 'history'" class="notice-list" v-loading="loading">
            <div
              v-for="notice in noticeList"
              :key="notice.ID || notice.id"
              class="notice-card"
            >
              <h3 class="notice-title">{{ notice.title }}</h3>
              <div class="notice-body">{{ notice.content }}</div>
              <div class="notice-footer">
                <span class="notice-status" :class="getStatusClass(notice)">
                  {{ getStatusText(notice) }}
                </span>
                <div class="notice-meta-right">
                  <span class="notice-region">区域：{{ getRegionLabel(notice) }}</span>
                  <span class="notice-date">
                    发布时间：{{ formatTime(notice.CreatedAt || notice.created_at || notice._localTime) }}
                  </span>
                </div>
              </div>
            </div>
            <el-empty v-if="noticeList.length === 0" description="暂无公告" />
          </div>

          <div v-if="regionSubTab === 'publish'" class="publish-form">
            <el-form :model="publishForm" label-width="84px">
              <el-form-item label="公告标题">
                <el-input v-model="publishForm.title" placeholder="请输入公告标题" />
              </el-form-item>
              <el-form-item label="公告内容">
                <el-input
                  v-model="publishForm.content"
                  type="textarea"
                  :rows="10"
                  placeholder="请输入公告内容"
                />
              </el-form-item>
              <el-form-item label="发布区域">
                <el-select
                  v-model="publishForm.region"
                  placeholder="请选择发布区域"
                  style="width: 100%;"
                >
                  <el-option label="朝晖校区" value="朝晖校区" />
                  <el-option label="屏峰校区" value="屏峰校区" />
                  <el-option label="莫干山校区" value="莫干山校区" />
                </el-select>
              </el-form-item>
              <el-form-item label="是否置顶">
                <el-switch v-model="publishForm.is_top" />
              </el-form-item>
              <el-form-item>
                <div class="publish-submit">
                  <el-button type="primary" :loading="publishing" @click="handlePublish">发布</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <div v-if="currentTab === 'system'">
          <h2 class="section-title">系统公告</h2>
          <div class="notice-list">
            <div
              v-for="notice in systemNoticeList"
              :key="notice.ID || notice.id"
              class="notice-card"
            >
              <h3 class="notice-title">{{ notice.title }}</h3>
              <div class="notice-body">{{ notice.content }}</div>
              <div class="notice-footer">
                <div class="notice-meta-right">
                  <span class="notice-region">区域：{{ getRegionLabel(notice) }}</span>
                  <span class="notice-date">
                    发布时间：{{ formatTime(notice.CreatedAt || notice.created_at) }}
                  </span>
                </div>
                <el-button
                  v-if="!notice.confirmed"
                  type="warning"
                  size="small"
                  @click="confirmNotice(notice)"
                >
                  确认
                </el-button>
                <el-button v-else type="info" size="small" disabled>
                  已确认
                </el-button>
              </div>
            </div>
            <el-empty v-if="systemNoticeList.length === 0" description="暂无系统公告" />
          </div>
        </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面注释：NoticeList 页面的状态管理、交互处理与接口调用逻辑。
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, ArrowDown, FolderOpened, Flag } from '@element-plus/icons-vue'
import { getAnnouncements, createAnnouncement } from '@/api/admin'
import { useUserStore } from '@/stores/user'

const currentTab = ref('region')
const regionSubTab = ref('history')
const sidebarExpanded = ref(true)

const loading = ref(false)
const publishing = ref(false)
const confirmedNoticeIds = ref<number[]>([])
const noticeList = ref<any[]>([])
const systemNoticeList = ref<any[]>([])
const localPublished = ref<any[]>([])
const userStore = useUserStore()
let localIdCounter = 0

const hasUnread = computed(() => systemNoticeList.value.some((n: any) => !n.confirmed))


const publishForm = reactive({
  title: '',
  content: '',
  region: '',
  is_top: false,
})

function switchMainTab(tab: 'region' | 'system') {
  if (currentTab.value === tab) return
  currentTab.value = tab
}

function switchRegionSubTab(tab: 'history' | 'publish') {
  if (regionSubTab.value === tab) return
  regionSubTab.value = tab
}

function formatTime(t: string | undefined): string {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

function loadConfirmedNoticeIds() {
  try {
    const raw = localStorage.getItem('admin_confirmed_notice_ids')
    const list = raw ? JSON.parse(raw) : []
    confirmedNoticeIds.value = Array.isArray(list) ? list.map((v) => Number(v)).filter(Boolean) : []
  } catch {
    confirmedNoticeIds.value = []
  }
}

function saveConfirmedNoticeIds() {
  localStorage.setItem('admin_confirmed_notice_ids', JSON.stringify(confirmedNoticeIds.value))
}

function localRegionDraftKey() {
  return `admin_region_notice_drafts_${userStore.username || 'unknown'}`
}

function loadLocalPublished() {
  try {
    const raw = localStorage.getItem(localRegionDraftKey())
    const list = raw ? JSON.parse(raw) : []
    localPublished.value = Array.isArray(list) ? list : []
    localIdCounter = localPublished.value.reduce((max: number, item: any) => {
      const id = Number(item?._localId || 0)
      return id > max ? id : max
    }, 0)
  } catch {
    localPublished.value = []
    localIdCounter = 0
  }
}

function saveLocalPublished() {
  localStorage.setItem(localRegionDraftKey(), JSON.stringify(localPublished.value))
}

function normalizeNoticeStatus(notice: any): string {
  const s = String(notice?.status ?? notice?.review_status ?? '').toLowerCase()
  if (['approved', 'allow', 'allowed', 'pass', 'passed', 'published', 'success'].includes(s)) return 'approved'
  if (['rejected', 'reject', 'denied', 'deny', 'failed', 'refused'].includes(s)) return 'rejected'
  return 'pending'
}

function getStatusText(notice: any): string {
  const status = normalizeNoticeStatus(notice)
  if (status === 'approved') return '已审核'
  if (status === 'rejected') return '已驳回'
  return '未审核'
}

function getStatusClass(notice: any): string {
  const status = normalizeNoticeStatus(notice)
  if (status === 'approved') return 'pass'
  if (status === 'rejected') return 'reject'
  return 'pending'
}

function getRegionLabel(notice: any): string {
  const type = String(notice?.type ?? notice?.announcement_type ?? notice?.notice_type ?? '').toLowerCase()
  const region = String(notice?.region ?? '').trim()
  if (type.includes('system')) return '全体用户'
  return region || '未指定'
}

async function fetchNoticeList() {
  loading.value = true
  try {
    const res = await getAnnouncements({ page: 1, pageSize: 50 })
    const resData = res.data?.data ?? res.data ?? {}
    const list: any[] = Array.isArray(resData) ? resData : (resData.list ?? resData.items ?? [])

    const getType = (n: any) => String(n?.type ?? n?.announcement_type ?? n?.notice_type ?? '').toLowerCase()
    const isSystem = (n: any) => getType(n).includes('system')

    const regionFromApi = list.filter((n: any) => !isSystem(n))
    let systemFromApi = list.filter((n: any) => isSystem(n))
    if (systemFromApi.length === 0 && regionFromApi.length === 0 && list.length > 0) {
      systemFromApi = list
    }

    systemNoticeList.value = systemFromApi.map((n: any) => ({
      ...n,
      confirmed: confirmedNoticeIds.value.includes(Number(n.ID ?? n.id ?? 0)),
    }))
    localPublished.value = localPublished.value
      .map((local: any) => {
        const existsInApi = regionFromApi.some((apiItem: any) => {
          const sameTitle = String(apiItem?.title ?? '').trim() === String(local?.title ?? '').trim()
          const sameContent = String(apiItem?.content ?? '').trim() === String(local?.content ?? '').trim()
          return sameTitle && sameContent
        })
        if (existsInApi) {
          return { ...local, status: 'approved' }
        }
        return local
      })
      .filter((local: any) => normalizeNoticeStatus(local) === 'pending')
    saveLocalPublished()

    const merged = [...regionFromApi]
    localPublished.value.forEach((local: any) => {
      const existsInApi = regionFromApi.some((apiItem: any) => {
        const sameTitle = String(apiItem?.title ?? '').trim() === String(local?.title ?? '').trim()
        const sameContent = String(apiItem?.content ?? '').trim() === String(local?.content ?? '').trim()
        return sameTitle && sameContent
      })
      if (!existsInApi) merged.unshift(local)
    })

    noticeList.value = merged

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '获取公告失败'
    ElMessage.error(errMsg)
    noticeList.value = []
  } finally {
    loading.value = false
  }
}

async function handlePublish() {
  if (!publishForm.title.trim() || !publishForm.content.trim() || !publishForm.region.trim()) {
    ElMessage.warning('请填写标题、内容和发布区域')
    return
  }

  publishing.value = true
  try {
    const publishTitle = publishForm.title.trim()
    const publishContent = publishForm.content.trim()
    const publishRegion = publishForm.region.trim()
    const res = await createAnnouncement({
      title: publishTitle,
      content: publishContent,
      type: 'region',
      region: publishRegion,
      is_top: publishForm.is_top,
    })
    const code = Number((res as any)?.data?.code ?? 200)
    if (code !== 200) {
      const msg = String((res as any)?.data?.msg || '发布失败')
      throw new Error(msg)
    }

    ElMessage.success('发布成功')
    localPublished.value.unshift({
      _localId: ++localIdCounter,
      _isLocal: true,
      _localTime: new Date().toISOString(),
      title: publishTitle,
      content: publishContent,
      status: 'pending',
      type: 'region',
      region: publishRegion,
      publisher: userStore.username,
    })
    saveLocalPublished()
    publishForm.title = ''
    publishForm.content = ''
    publishForm.region = ''
    regionSubTab.value = 'history'
    await fetchNoticeList()
    const existsInServerList = noticeList.value.some((item: any) => {
      const sameTitle = String(item?.title ?? '').trim() === publishTitle
      const sameContent = String(item?.content ?? '').trim() === publishContent
      return sameTitle && sameContent
    })
    if (!existsInServerList) {
      ElMessage.warning('发布请求已提交，但列表未返回该公告，请联系后端检查公告写入与查询逻辑')
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '发布失败'
    ElMessage.error(errMsg)
  } finally {
    publishing.value = false
  }
}

function confirmNotice(notice: any) {
  const id = Number(notice.ID ?? notice.id ?? 0)
  if (id && !confirmedNoticeIds.value.includes(id)) {
    confirmedNoticeIds.value.push(id)
    saveConfirmedNoticeIds()
  }
  notice.confirmed = true
  ElMessage.success('已确认')
}

onMounted(() => {
  loadConfirmedNoticeIds()
  loadLocalPublished()
  fetchNoticeList()
})
</script>

<style scoped>
.notice-page {
  padding: 0;
}

.notice-layout {
  display: flex;
  gap: 24px;
  min-height: calc(100vh - 120px);
}

.notice-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  min-height: calc(100vh - 120px);
}

.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 8px;
  cursor: pointer;
  color: #333;
  font-size: 16px;
  font-weight: 700;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow {
  transition: transform 0.2s;
}

.arrow.folded {
  transform: rotate(-90deg);
}

.sidebar-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  position: relative;
  transition: all 0.2s;
}

.sidebar-item:hover,
.sidebar-item.active {
  background: #fdf6ec;
  color: #e6a23c;
}

.dot-red {
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.tab-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.switch-btn {
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.switch-btn:active {
  transform: scale(0.97);
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 20px;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px 24px;
}

.notice-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 12px;
}

.notice-body {
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.notice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.notice-status {
  font-size: 13px;
  color: #999;
}

.notice-status.pass {
  color: #67c23a;
  font-weight: 700;
}

.notice-status.reject {
  color: #f56c6c;
  font-weight: 700;
}

.notice-status.pending {
  color: #e6a23c;
  font-weight: 700;
}

.notice-meta-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.notice-region,
.notice-date {
  font-size: 13px;
  color: #999;
}

.publish-form {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.publish-submit {
  text-align: right;
  width: 100%;
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>






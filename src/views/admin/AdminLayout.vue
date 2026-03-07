<template>
  <div class="admin-layout">
    <header class="top-nav">
      <div class="nav-left">
        <div class="logo" @click="router.push('/admin/dashboard')">
          <img src="/logo.jpg" alt="logo" class="logo-icon" />
          <span class="logo-text">失物招领</span>
        </div>
        <nav class="nav-links">
          <router-link
            to="/admin/audit"
            :class="{ active: (route.path.startsWith('/admin/audit') || route.path.startsWith('/admin/claim-audit')) && !route.path.includes('history') }"
          >
            审核管理
            <el-badge v-if="totalPending > 0" :value="totalPending" :max="99" class="nav-badge" />
          </router-link>
          <router-link to="/admin/items" :class="{ active: route.path === '/admin/items' }">物品管理</router-link>
          <router-link to="/admin/notices" :class="{ active: route.path === '/admin/notices' }">公告信息</router-link>
          <router-link to="/admin/dashboard" :class="{ active: route.path === '/admin/dashboard' }">数据总览</router-link>
        </nav>
      </div>
      <div class="nav-right">
        <el-dropdown trigger="click" placement="bottom-end">
          <div class="user-info">
            <div class="avatar-wrapper">
              <img src="/头像框@2.png" alt="avatar-frame" class="avatar-frame" />
            </div>
            <span class="user-name">{{ userStore.username || '管理员' }}</span>
            <el-icon class="arrow-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <el-dialog
      v-model="noticeDialogVisible"
      title="系统通知与公告"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      top="12vh"
    >
      <div class="notice-dialog-body">
        <div v-if="systemNotices.length === 0" class="notice-empty">
          <el-empty description="暂无系统公告" :image-size="80" />
        </div>
        <div v-else class="notice-scroll">
          <div v-for="notice in systemNotices" :key="notice.ID || notice.id" class="notice-item">
            <div class="notice-item-header">
              <el-tag v-if="notice.is_top" type="danger" size="small" effect="dark">置顶</el-tag>
              <h4>{{ notice.title }}</h4>
            </div>
            <p class="notice-item-content">{{ notice.content }}</p>
            <span class="notice-item-time">
              {{ notice.CreatedAt ? new Date(notice.CreatedAt).toLocaleString('zh-CN') : '' }}
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="notice-dialog-footer">
          <span class="notice-count">共 {{ systemNotices.length }} 条公告</span>
          <el-button type="warning" size="large" @click="confirmNotices">我已知悉，进入系统</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getAllItems, getPendingClaims, getAnnouncements } from '@/api/admin'
import { logoutApi } from '@/api/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pendingItemCount = ref(0)
const pendingClaimCount = ref(0)
const totalPending = computed(() => pendingItemCount.value + pendingClaimCount.value)

const noticeDialogVisible = ref(false)
const systemNotices = ref<any[]>([])

async function fetchAndShowNotices() {
  try {
    const res = await getAnnouncements({ page: 1, pageSize: 50 })
    const resData = res.data?.data ?? res.data ?? {}
    const list: any[] = Array.isArray(resData) ? resData : (resData.list ?? resData.items ?? [])

    const isSystemNotice = (n: any) => {
      const type = String(n?.type ?? n?.announcement_type ?? n?.notice_type ?? '').toLowerCase()
      if (!type) return true
      return type.includes('system')
    }
    const isApproved = (n: any) => {
      const status = String(n?.status ?? n?.review_status ?? '').toLowerCase()
      if (!status) return true
      return ['approved', 'allow', 'allowed', 'pass', 'passed'].includes(status)
    }

    systemNotices.value = list
      .filter((n: any) => isSystemNotice(n) && isApproved(n))
      .sort((a: any, b: any) => {
        if (a.is_top && !b.is_top) return -1
        if (!a.is_top && b.is_top) return 1
        return 0
      })

    const hasShown = sessionStorage.getItem('admin_notice_shown')
    if (!hasShown && systemNotices.value.length > 0) {
      noticeDialogVisible.value = true
    }
  } catch {
    console.warn('[AdminLayout] 获取系统公告失败')
  }
}

function confirmNotices() {
  noticeDialogVisible.value = false
  sessionStorage.setItem('admin_notice_shown', 'true')
}

async function fetchPendingCounts() {
  const readTotal = (payload: any) => Number(payload?.data?.total ?? payload?.total ?? 0)
  const [itemsResult, claimsResult] = await Promise.allSettled([
    getAllItems({ page: 1, pageSize: 1, status: 'pending' }),
    getPendingClaims({ page: 1, pageSize: 1 }),
  ])

  if (itemsResult.status === 'fulfilled') {
    pendingItemCount.value = readTotal(itemsResult.value?.data)
  } else {
    pendingItemCount.value = 0
  }

  if (claimsResult.status === 'fulfilled') {
    pendingClaimCount.value = readTotal(claimsResult.value?.data)
  } else {
    pendingClaimCount.value = 0
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    try {
      const response = await logoutApi()
      if (Number(response?.data?.code) !== 200) {
        ElMessage.warning(response?.data?.msg || '退出接口调用失败，已执行本地退出')
      }
    } catch {
      ElMessage.warning('退出接口调用失败，已执行本地退出')
    }
    userStore.clearUser()
    sessionStorage.removeItem('admin_notice_shown')
    router.push('/')
    ElMessage.success('已安全退出')
  } catch {
    // user cancelled
  }
}

onMounted(() => {
  window.addEventListener('admin-pending-refresh', fetchPendingCounts)
  fetchPendingCounts()
  fetchAndShowNotices()
})

onBeforeUnmount(() => {
  window.removeEventListener('admin-pending-refresh', fetchPendingCounts)
})
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #fdf6ec;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 2px solid #e6a23c;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.logo-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #e6a23c;
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-links a {
  text-decoration: none;
  color: #333;
  font-size: 15px;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.nav-links a:hover,
.nav-links a.active,
.nav-links a.router-link-active {
  color: #e6a23c;
  border-bottom-color: #e6a23c;
}

.nav-badge {
  position: absolute;
  top: -8px;
  right: -20px;
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.avatar-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-frame {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.arrow-icon {
  color: #999;
  font-size: 12px;
}

.main-content {
  padding: 24px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.notice-dialog-body {
  max-height: 50vh;
}

.notice-scroll {
  max-height: 42vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.notice-item {
  background: #fff7e6;
  border: 1px solid #f8d9a5;
  border-radius: 8px;
  padding: 12px;
}

.notice-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.notice-item-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.notice-item-content {
  margin: 0 0 8px;
  color: #555;
  white-space: pre-wrap;
}

.notice-item-time {
  color: #999;
  font-size: 12px;
}

.notice-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notice-count {
  color: #666;
  font-size: 13px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

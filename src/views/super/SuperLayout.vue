<template>
  <div class="admin-layout">
    <header class="top-nav">
      <div class="nav-left">
        <div class="logo" @click="router.push('/super/dashboard')">
          <img src="/logo.jpg" alt="logo" class="logo-icon" />
          <span class="logo-text">失物招领 · 超管</span>
        </div>
        <nav class="nav-links">
          <router-link to="/super/dashboard" :class="{ active: route.path === '/super/dashboard' }">系统设置</router-link>
          <router-link to="/super/users" :class="{ active: route.path === '/super/users' }">用户管理</router-link>
          <router-link to="/super/notices" :class="{ active: route.path === '/super/notices' }">公告管理</router-link>
          <router-link to="/super/data" :class="{ active: route.path === '/super/data' }">数据管理</router-link>
          <router-link to="/super/feedback" :class="{ active: route.path === '/super/feedback' }">反馈中心</router-link>
        </nav>
      </div>
      <div class="nav-right">
        <el-dropdown trigger="click" placement="bottom-end">
          <div class="user-info">
            <div class="avatar-wrapper">
              <img src="/头像框@2.png" alt="avatar-frame" class="avatar-frame" />
            </div>
            <span class="user-name">{{ userStore.username || '超管' }}</span>
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
  </div>
</template>

<script setup lang="ts">
// 页面注释：SuperLayout 页面的状态管理、交互处理与接口调用逻辑。
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    userStore.clearUser()
    router.push('/')
    ElMessage.success('已安全退出')
  } catch {
    // cancel
  }
}
</script>

<style scoped>
.admin-layout { min-height: 100vh; background: #fdf6ec; }
.top-nav {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; padding: 0 24px; background: #fff; border-bottom: 2px solid #e6a23c;
  position: sticky; top: 0; z-index: 100;
}
.nav-left { display: flex; align-items: center; gap: 32px; }
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.logo-icon { width: 32px; height: 32px; object-fit: contain; }
.logo-text { font-size: 18px; font-weight: 700; color: #e6a23c; }
.nav-links { display: flex; gap: 24px; }
.nav-links a {
  text-decoration: none; color: #333; font-size: 15px; padding: 4px 0;
  border-bottom: 2px solid transparent; transition: all 0.2s;
}
.nav-links a:hover, .nav-links a.active, .nav-links a.router-link-active {
  color: #e6a23c; border-bottom-color: #e6a23c;
}
.nav-right { display: flex; align-items: center; }
.user-info { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.avatar-wrapper {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.avatar-frame { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-size: 14px; color: #333; }
.arrow-icon { color: #999; font-size: 12px; }
.main-content { padding: 24px 40px; max-width: 1400px; margin: 0 auto; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>




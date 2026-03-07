<template>
  <div class="global-page" v-loading="loading">
    <el-row :gutter="12" class="stats-row">
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><span>总用户</span><b>{{ stats.total_users }}</b></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><span>活跃用户</span><b>{{ stats.active_users }}</b></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><span>累计发布</span><b>{{ stats.total_items }}</b></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat"><span>已找回</span><b>{{ stats.solved_items }}</b></div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>系统参数配置</span>
          <el-button :loading="loading" @click="refreshStats">刷新统计</el-button>
        </div>
      </template>

      <el-form :model="form" label-width="140px" class="config-form">
        <el-form-item label="物品分类">
          <el-input v-model="form.itemTypes" placeholder="逗号分隔，如：电子产品,证件,衣物" />
        </el-form-item>
        <el-form-item label="认领时效（天）">
          <el-input-number v-model="form.claimDays" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="发布频率限制">
          <el-switch v-model="form.frequencyLimit" />
          <span class="inline-gap">每日上限</span>
          <el-input-number v-model="form.frequencyLimitCount" :min="1" :max="20" :disabled="!form.frequencyLimit" />
        </el-form-item>
        <el-form-item label="内容规范">
          <el-checkbox v-model="form.contentNorms">启用敏感词拦截</el-checkbox>
        </el-form-item>
        <el-form-item label="必填字段控制">
          <el-checkbox-group v-model="form.requiredFields">
            <el-checkbox label="itemName">物品名称</el-checkbox>
            <el-checkbox label="location">地点</el-checkbox>
            <el-checkbox label="time">时间</el-checkbox>
            <el-checkbox label="features">特征描述</el-checkbox>
            <el-checkbox label="contact">联系人</el-checkbox>
            <el-checkbox label="phone">联系电话</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="图片最少张数">
          <el-input-number v-model="form.requiredImages" :min="0" :max="10" />
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button @click="previewVisible = true">预览</el-button>
        <el-button type="warning" plain @click="handleSave">保存配置</el-button>
      </div>
    </el-card>

    <el-dialog v-model="previewVisible" title="配置预览" width="680px">
      <el-descriptions border :column="1">
        <el-descriptions-item label="物品分类">{{ form.itemTypes }}</el-descriptions-item>
        <el-descriptions-item label="认领时效">{{ form.claimDays }} 天</el-descriptions-item>
        <el-descriptions-item label="发布限制">
          {{ form.frequencyLimit ? `开启，每天${form.frequencyLimitCount}条` : '关闭' }}
        </el-descriptions-item>
        <el-descriptions-item label="必填字段">{{ requiredFieldText }}</el-descriptions-item>
        <el-descriptions-item label="图片要求">至少 {{ form.requiredImages }} 张</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 页面注释：GlobalManagement 页面的状态管理、交互处理与接口调用逻辑。
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSuperStats } from '@/api/super'

const loading = ref(false)
const previewVisible = ref(false)

const stats = reactive({
  total_users: 0,
  active_users: 0,
  total_items: 0,
  solved_items: 0,
  total_claims: 0,
  today_items: 0,
})

const form = reactive({
  itemTypes: '电子产品,证件,衣物,书籍,其他',
  claimDays: 30,
  frequencyLimit: true,
  frequencyLimitCount: 3,
  contentNorms: true,
  requiredFields: ['itemName', 'location', 'time', 'features', 'contact', 'phone'] as string[],
  requiredImages: 1,
})

const requiredFieldText = computed(() => {
  const map: Record<string, string> = {
    itemName: '物品名称',
    location: '地点',
    time: '时间',
    features: '特征描述',
    contact: '联系人',
    phone: '联系电话',
  }
  return form.requiredFields.map((key) => map[key]).filter(Boolean).join('、') || '无'
})

async function refreshStats() {
  loading.value = true
  try {
    const res = await getSuperStats()
    const data = res.data?.data ?? {}
    stats.total_users = data.total_users ?? 0
    stats.active_users = data.active_users ?? 0
    stats.total_items = data.total_items ?? 0
    stats.solved_items = data.solved_items ?? 0
    stats.total_claims = data.total_claims ?? 0
    stats.today_items = data.today_items ?? 0
  } catch {
    ElMessage.error('刷新统计失败')
  } finally {
    loading.value = false
  }
}

function handleSave() {
  ElMessage.success('配置已保存（前端演示）')
}

onMounted(refreshStats)
</script>

<style scoped>
.global-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fdf6ec;
  padding: 12px;
  border-radius: 10px;
}

.stats-row .stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-row .stat span {
  color: #5f6673;
  font-size: 13px;
}

.stats-row .stat b {
  font-size: 24px;
  color: #2e3642;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inline-gap {
  margin: 0 8px 0 14px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>





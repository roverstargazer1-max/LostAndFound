<template>
  <div class="dashboard-page" v-loading="loading">
    <!-- 顶部三张统计卡 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-card-body">
          <div>
            <p class="stat-label">发布总量</p>
            <p class="stat-number">{{ formatNum(stats.total_items) }}</p>
          </div>
          <div class="stat-icon green">
            <el-icon :size="28"><CirclePlus /></el-icon>
          </div>
        </div>
        <p class="stat-sub green-text">
          失物帖 {{ formatNum(stats.lost_items) }} · 招领帖 {{ formatNum(stats.found_items) }}
        </p>
      </div>

      <div class="stat-card">
        <div class="stat-card-body">
          <div>
            <p class="stat-label">匹配成功数</p>
            <p class="stat-number">{{ formatNum(stats.matched_items) }}</p>
          </div>
          <div class="stat-icon yellow">
            <el-icon :size="28"><Connection /></el-icon>
          </div>
        </div>
        <p class="stat-sub green-text">成功率 {{ safePercent(stats.matched_items, stats.total_items) }}%</p>
      </div>

      <div class="stat-card">
        <div class="stat-card-body">
          <div>
            <p class="stat-label">认领成功数</p>
            <p class="stat-number">{{ formatNum(stats.claimed_items) }}</p>
          </div>
          <div class="stat-icon orange">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
        </div>
        <p class="stat-sub green-text">认领率 {{ safePercent(stats.claimed_items, stats.total_items) }}%</p>
      </div>
    </div>

    <!-- 状态分布卡片 -->
    <div class="stat-cards">
      <div class="stat-card small">
        <div class="stat-card-body">
          <div>
            <p class="stat-label">待审核</p>
            <p class="stat-number warn">{{ formatNum(stats.pending_items) }}</p>
          </div>
          <div class="stat-icon red">
            <el-icon :size="24"><Warning /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card small">
        <div class="stat-card-body">
          <div>
            <p class="stat-label">已通过</p>
            <p class="stat-number">{{ formatNum(stats.approved_items) }}</p>
          </div>
          <div class="stat-icon green">
            <el-icon :size="24"><Select /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card small">
        <div class="stat-card-body">
          <div>
            <p class="stat-label">已驳回</p>
            <p class="stat-number">{{ formatNum(stats.rejected_items) }}</p>
          </div>
          <div class="stat-icon red">
            <el-icon :size="24"><CloseBold /></el-icon>
          </div>
        </div>
      </div>
      <div class="stat-card small">
        <div class="stat-card-body">
          <div>
            <p class="stat-label">已归档</p>
            <p class="stat-number">{{ formatNum(stats.archived_items) }}</p>
          </div>
          <div class="stat-icon grey">
            <el-icon :size="24"><FolderChecked /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 三列排行卡片 -->
    <div class="rank-cards">
      <div class="rank-card">
        <h3><el-icon color="#f56c6c"><Location /></el-icon> 最多失物/捡取地点</h3>
        <div class="rank-list">
          <div class="rank-item" v-for="(item, idx) in topLocations" :key="idx">
            <span class="rank-index" :class="'top' + (idx + 1)">{{ idx + 1 }}</span>
            <span class="rank-name">{{ item.name }}</span>
            <el-progress
              :percentage="item.count / (topLocations[0]?.count || 1) * 100"
              :show-text="false"
              :stroke-width="8"
              color="#e6a23c"
              style="flex: 1; margin: 0 12px;"
            />
            <span class="rank-num">{{ formatNum(item.count) }}</span>
          </div>
          <el-empty v-if="topLocations.length === 0" description="暂无数据" :image-size="60" />
        </div>
      </div>

      <div class="rank-card">
        <h3><el-icon color="#e6a23c"><OfficeBuilding /></el-icon> 校区分布</h3>
        <div class="rank-list">
          <div class="rank-item" v-for="(item, idx) in topCampuses" :key="idx">
            <span class="rank-index" :class="'top' + (idx + 1)">{{ idx + 1 }}</span>
            <span class="rank-name">{{ item.name }}</span>
            <el-progress
              :percentage="item.count / (topCampuses[0]?.count || 1) * 100"
              :show-text="false"
              :stroke-width="8"
              color="#409eff"
              style="flex: 1; margin: 0 12px;"
            />
            <span class="rank-num">{{ formatNum(item.count) }}</span>
          </div>
          <el-empty v-if="topCampuses.length === 0" description="暂无数据" :image-size="60" />
        </div>
      </div>

      <div class="rank-card">
        <h3><el-icon color="#67c23a"><PriceTag /></el-icon> 物品类型分布</h3>
        <div class="rank-list">
          <div class="rank-item" v-for="(item, idx) in topCategories" :key="idx">
            <span class="rank-index" :class="'top' + (idx + 1)">{{ idx + 1 }}</span>
            <span class="rank-name">{{ item.name }}</span>
            <el-progress
              :percentage="item.count / (topCategories[0]?.count || 1) * 100"
              :show-text="false"
              :stroke-width="8"
              color="#67c23a"
              style="flex: 1; margin: 0 12px;"
            />
            <span class="rank-num">{{ formatNum(item.count) }}</span>
          </div>
          <el-empty v-if="topCategories.length === 0" description="暂无数据" :image-size="60" />
        </div>
      </div>
    </div>

    <!-- 详细统计表格 -->
    <div class="detail-table-card">
      <div class="table-header">
        <h3><el-icon color="#409eff"><Memo /></el-icon> 详细统计信息</h3>
        <div class="manage-btns">
          <el-button type="warning" :loading="exportLoading" @click="handleExport">
            <el-icon><Download /></el-icon> 导出报表
          </el-button>
          <el-button plain @click="refreshData">
            <el-icon><Refresh /></el-icon> 刷新数据
          </el-button>
        </div>
      </div>
      <el-table :data="detailStats" :header-cell-style="{ background: '#fdf6ec' }" style="width: 100%">
        <el-table-column prop="name" label="统计项目" min-width="200" />
        <el-table-column prop="count" label="数量" width="120" align="center">
          <template #default="{ row }">
            <span style="font-weight: bold; color: #e6a23c;">{{ formatNum(row.count) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="percent" label="占比" width="150" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="parseFloat(row.percent)"
              :stroke-width="14"
              :text-inside="true"
              color="#e6a23c"
              style="width: 100px; display: inline-flex;"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 最近7天趋势 -->
    <div class="trend-card">
      <h3><el-icon color="#409eff"><TrendCharts /></el-icon> 最近 7 天发布趋势</h3>
      <div class="trend-chart">
        <div class="trend-bar-group" v-for="(day, idx) in trendData" :key="idx">
          <div class="trend-bar-wrapper">
            <div
              class="trend-bar lost"
              :style="{ height: (day.lost / maxTrend * 120) + 'px' }"
            >
              <span class="bar-num" v-if="day.lost">{{ day.lost }}</span>
            </div>
            <div
              class="trend-bar found"
              :style="{ height: (day.found / maxTrend * 120) + 'px' }"
            >
              <span class="bar-num" v-if="day.found">{{ day.found }}</span>
            </div>
          </div>
          <span class="trend-label">{{ day.label }}</span>
        </div>
      </div>
      <div class="trend-legend">
        <span class="legend-item"><span class="legend-dot lost"></span>失物帖</span>
        <span class="legend-item"><span class="legend-dot found"></span>招领帖</span>
      </div>
    </div>

    <!-- 底部 -->
    <div class="dashboard-footer">
      数据更新时间：{{ lastUpdateTime }} · 失物招领系统 · 数据统计中心
    </div>
  </div>
</template>

<script setup lang="ts">
// 页面注释：Dashboard 页面的状态管理、交互处理与接口调用逻辑。
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CirclePlus, Connection, CircleCheck, Location, OfficeBuilding,
  PriceTag, Download, Refresh, Memo, Warning, Select,
  CloseBold, FolderChecked, TrendCharts
} from '@element-plus/icons-vue'
import { getDashboardStats, getAllItems, exportStatsCSV } from '@/api/admin'

const loading = ref(false)
const exportLoading = ref(false)
const lastUpdateTime = ref('')

// ==================== 统计数据（兼容 /api/v1/admin/stats） ====================
const stats = ref({
  total_items: 0,
  lost_items: 0,
  found_items: 0,
  pending_items: 0,
  approved_items: 0,
  matched_items: 0,
  claimed_items: 0,
  rejected_items: 0,
  archived_items: 0,
})

// ==================== 排行榜数据（由物品列表计算） ====================
const topLocations = ref<{ name: string; count: number }[]>([])
const topCampuses = ref<{ name: string; count: number }[]>([])
const topCategories = ref<{ name: string; count: number }[]>([])

// ==================== 趋势数据（由物品列表计算） ====================
const trendData = ref<{ label: string; lost: number; found: number }[]>([])

const maxTrend = computed(() => {
  let max = 1
  trendData.value.forEach(d => {
    if (d.lost > max) max = d.lost
    if (d.found > max) max = d.found
  })
  return max
})

// ==================== 详细统计（由 stats 生成表格） ====================
const detailStats = computed(() => {
  const total = stats.value.total_items || 1
  return [
    { name: '失物帖', count: stats.value.lost_items, percent: (stats.value.lost_items / total * 100).toFixed(1) },
    { name: '招领帖', count: stats.value.found_items, percent: (stats.value.found_items / total * 100).toFixed(1) },
    { name: '待审核', count: stats.value.pending_items, percent: (stats.value.pending_items / total * 100).toFixed(1) },
    { name: '已通过', count: stats.value.approved_items, percent: (stats.value.approved_items / total * 100).toFixed(1) },
    { name: '已匹配', count: stats.value.matched_items, percent: (stats.value.matched_items / total * 100).toFixed(1) },
    { name: '已认领', count: stats.value.claimed_items, percent: (stats.value.claimed_items / total * 100).toFixed(1) },
    { name: '已驳回', count: stats.value.rejected_items, percent: (stats.value.rejected_items / total * 100).toFixed(1) },
    { name: '已归档', count: stats.value.archived_items, percent: (stats.value.archived_items / total * 100).toFixed(1) },
  ]
})

// ==================== 工具函数 ====================
function formatNum(n: number) {
  if (!n) return '0'
  return n.toLocaleString()
}

function safePercent(part: number, total: number): string {
  if (!total || total === 0) return '0.0'
  return Math.min(100, (part / total) * 100).toFixed(1)
}

/** 统计数组某字段的 Top N */
function countTop(items: any[], field: string, topN = 5): { name: string; count: number }[] {
  const map: Record<string, number> = {}
  items.forEach(item => {
    const val = (item[field] || '').toString().trim()
    if (val) {
      map[val] = (map[val] || 0) + 1
    }
  })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
}

function isLostPost(item: any): boolean {
  const t = String(item?.type ?? '').toLowerCase()
  if (t === 'lost') return true
  if (t === 'found') return false
  return Number(item?.lost_or_found) === 1
}

function isFoundPost(item: any): boolean {
  const t = String(item?.type ?? '').toLowerCase()
  if (t === 'found') return true
  if (t === 'lost') return false
  return Number(item?.lost_or_found) === 2
}

/** 统计最近 7 天趋势 */
function calcTrend(items: any[]): { label: string; lost: number; found: number }[] {
  const result: { label: string; lost: number; found: number }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const dayEnd = dayStart + 86400000

    let lost = 0
    let found = 0
    items.forEach(item => {
      const t = new Date(item.CreatedAt || item.created_at).getTime()
      if (t >= dayStart && t < dayEnd) {
        if (isLostPost(item)) lost++
        else if (isFoundPost(item)) found++
      }
    })
    result.push({ label: dateStr, lost, found })
  }
  return result
}

// ==================== 数据获取 ====================

/** 获取统计接口数据 */
async function fetchStats() {
  try {
    const res = await getDashboardStats()
    const d = res.data?.data ?? res.data ?? {}
    stats.value = {
      total_items: d.total ?? d.total_items ?? 0,
      lost_items: d.lost ?? d.lost_items ?? 0,
      found_items: d.found ?? d.found_items ?? 0,
      pending_items: d.pending ?? d.pending_items ?? 0,
      approved_items: d.approved ?? d.approved_items ?? 0,
      matched_items: d.matched ?? d.matched_items ?? 0,
      claimed_items: d.claimed ?? d.claimed_items ?? 0,
      rejected_items: d.rejected ?? d.rejected_items ?? 0,
      archived_items: d.archived ?? d.archived_items ?? 0,
    }
    return true
  } catch {
    console.warn('[Dashboard] 统计接口不可用，使用物品列表兜底计算')
    return false
  }
}

/** 获取物品列表，计算排行榜和趋势，并用列表重算状态统计 */
async function fetchItemsForCharts() {
  try {
    const res = await getAllItems({ page: 1, pageSize: 9999 })
    const resData = res.data?.data ?? res.data ?? {}
    const allItems: any[] = resData.list ?? resData.items ?? []

    // 以前端列表实时重算状态，避免统计接口与页面不同步
    const total = allItems.length
    stats.value = {
      total_items: total,
      lost_items: allItems.filter(i => isLostPost(i)).length,
      found_items: allItems.filter(i => isFoundPost(i)).length,
      pending_items: allItems.filter(i => i.status === 'pending').length,
      approved_items: allItems.filter(i => i.status === 'approved').length,
      matched_items: allItems.filter(i => i.status === 'matched').length,
      claimed_items: allItems.filter(i => i.status === 'claimed').length,
      rejected_items: allItems.filter(i => i.status === 'rejected' || i.status === 'cancelled').length,
      archived_items: allItems.filter(i => i.status === 'archived').length,
    }

    // 排行榜（前端计算，接口未直接提供）
    topLocations.value = countTop(allItems, 'location', 5)
    topCampuses.value = countTop(allItems, 'campus', 5)
    topCategories.value = countTop(allItems, 'category', 5)

    // 趋势图（前端计算，接口未直接提供）
    trendData.value = calcTrend(allItems)
  } catch {
    console.warn('[Dashboard] 物品列表获取失败')
  }
}

/** 主入口：先取统计接口，再用列表兜底重算 */
async function fetchDashboard() {
  loading.value = true
  try {
    // 第一步：请求统计接口
    await fetchStats()

    // 第二步：请求物品列表并重算排行榜/趋势/状态
    await fetchItemsForCharts()

    lastUpdateTime.value = new Date().toLocaleString('zh-CN')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '获取数据失败'
    ElMessage.error(errMsg)
  } finally {
    loading.value = false
  }
}

/** 导出统计报表（CSV） */
async function handleExport() {
  if (exportLoading.value) return
  exportLoading.value = true
  try {
    const res = await exportStatsCSV()
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `统计报表_${new Date().toLocaleDateString('zh-CN')}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

/** 刷新数据 */
function refreshData() {
  fetchDashboard()
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.dashboard-page { padding: 0; }

/* ===== 统计卡片 ===== */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
.stat-cards:has(.small) {
  grid-template-columns: repeat(4, 1fr);
}
.stat-card {
  background: #fff;
  border: 2px solid #f5d4a0;
  border-radius: 12px;
  padding: 20px 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230, 162, 60, 0.15);
}
.stat-card.small { padding: 16px 20px; }
.stat-card-body { display: flex; justify-content: space-between; align-items: center; }
.stat-label { font-size: 14px; color: #999; margin: 0 0 8px 0; }
.stat-number { font-size: 36px; font-weight: bold; color: #333; margin: 0; }
.stat-number.warn { color: #e6a23c; }
.stat-card.small .stat-number { font-size: 28px; }

.stat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.stat-icon.green { background: #e8f5e9; color: #4caf50; }
.stat-icon.yellow { background: #fff8e1; color: #ff9800; }
.stat-icon.orange { background: #fff3e0; color: #e6a23c; }
.stat-icon.red { background: #fde8e8; color: #f56c6c; }
.stat-icon.grey { background: #f0f0f0; color: #909399; }

.stat-sub { margin: 8px 0 0 0; font-size: 13px; }
.green-text { color: #67c23a; }

/* ===== 排行卡片 ===== */
.rank-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
.rank-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.rank-card h3 {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; color: #333; margin: 0 0 16px 0;
}
.rank-list { display: flex; flex-direction: column; gap: 14px; }
.rank-item { display: flex; align-items: center; font-size: 14px; color: #333; }
.rank-index {
  width: 22px; height: 22px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: bold; color: #999;
  background: #f5f5f5; margin-right: 10px; flex-shrink: 0;
}
.rank-index.top1 { background: #fef0c7; color: #e6a23c; }
.rank-index.top2 { background: #e8f5e9; color: #67c23a; }
.rank-index.top3 { background: #e6f1fc; color: #409eff; }
.rank-name { width: 80px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-num { font-weight: bold; color: #e6a23c; min-width: 40px; text-align: right; }

/* ===== 详细统计表格 ===== */
.detail-table-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.table-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.table-header h3 {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; color: #333; margin: 0;
}
.manage-btns { display: flex; gap: 12px; }

/* ===== 趋势图 ===== */
.trend-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.trend-card h3 {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; color: #333; margin: 0 0 20px 0;
}
.trend-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 160px;
  padding: 0 20px;
}
.trend-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.trend-bar-wrapper {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 130px;
}
.trend-bar {
  width: 28px;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  transition: height 0.5s ease;
}
.trend-bar.lost { background: linear-gradient(180deg, #e6a23c, #f5d4a0); }
.trend-bar.found { background: linear-gradient(180deg, #409eff, #a0cfff); }
.bar-num {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}
.trend-label { font-size: 12px; color: #999; }
.trend-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 12px;
}
.legend-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #666;
}
.legend-dot {
  width: 12px; height: 12px; border-radius: 3px;
}
.legend-dot.lost { background: #e6a23c; }
.legend-dot.found { background: #409eff; }

/* ===== 搴曢儴 ===== */
.dashboard-footer {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 24px 0;
}
</style>





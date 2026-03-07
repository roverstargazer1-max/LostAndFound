<template>
  <div class="data-page">
    <section class="block">
      <h3 class="block-title">数据备份与导出</h3>
      <div class="top-grid">
        <div class="mini-card">
          <div class="mini-head">
            <span class="mini-icon orange"><el-icon><Coin /></el-icon></span>
            <div>
              <p class="mini-title">数据备份</p>
              <p class="mini-desc">创建系统数据完整备份</p>
            </div>
          </div>
          <el-button class="btn-orange" @click="backupConfirmVisible = true">立即备份</el-button>
        </div>

        <div class="mini-card">
          <div class="mini-head">
            <span class="mini-icon blue"><el-icon><Document /></el-icon></span>
            <div>
              <p class="mini-title">数据导出</p>
              <p class="mini-desc">导出指定范围数据</p>
            </div>
          </div>
          <el-button class="btn-blue" @click="exportConfigVisible = true">导出数据</el-button>
        </div>

        <div class="mini-card">
          <div class="mini-head">
            <span class="mini-icon green"><el-icon><RefreshLeft /></el-icon></span>
            <div>
              <p class="mini-title">备份导出历史</p>
              <p class="mini-desc">查看历史备份导出记录</p>
            </div>
          </div>
          <el-button class="btn-gray" @click="historyVisible = true">查看历史</el-button>
        </div>
      </div>
      <div class="latest">{{ latestBackupLabel }}</div>
    </section>

    <section class="block">
      <h3 class="block-title">数据清理</h3>
      <div class="clean-grid">
        <div class="clean-card">
          <div class="mini-head">
            <span class="mini-icon yellow"><el-icon><DeleteFilled /></el-icon></span>
            <div>
              <p class="mini-title">清理过期数据</p>
              <p class="mini-desc">将按保留策略清理历史过期记录</p>
            </div>
          </div>
          <el-checkbox v-model="keepRecent3Months">保留近3个月数据</el-checkbox>
          <el-button class="btn-red" :loading="cleaning" @click="handleCleanup">清理过期数据</el-button>
        </div>

        <div class="clean-card">
          <div class="mini-head">
            <span class="mini-icon purple"><el-icon><Opportunity /></el-icon></span>
            <div>
              <p class="mini-title">智能清理建议</p>
              <p class="mini-desc">系统推荐最佳实践</p>
            </div>
          </div>
          <ul class="tips">
            <li>建议保留最近6个月数据以满足审计需求</li>
            <li>定期清理超过1年的过期信息</li>
            <li>备份后再执行清理操作</li>
          </ul>
        </div>
      </div>
    </section>

    <el-dialog v-model="backupConfirmVisible" width="380px" align-center>
      <template #header><div class="dialog-title">确认立即备份？</div></template>
      <div class="dialog-body">
        <p>将创建系统数据完整备份</p>
        <p>预计耗时：2-5分钟</p>
        <p>备份期间系统可正常使用</p>
      </div>
      <template #footer>
        <div class="dialog-btns">
          <el-button class="btn-blue" @click="backupConfirmVisible = false">取消</el-button>
          <el-button class="btn-blue" @click="startBackup">确认备份</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="backupProgressVisible" width="380px" align-center :show-close="false">
      <template #header><div class="dialog-title">正在创建备份</div></template>
      <div class="dialog-body">
        <el-progress :percentage="backupProgress" :show-text="false" />
        <p>状态：进行中 {{ backupProgress }}%</p>
        <p>正在打包业务数据与附件索引</p>
        <p>请勿关闭当前页面</p>
      </div>
    </el-dialog>

    <el-dialog v-model="backupSuccessVisible" width="380px" align-center>
      <template #header><div class="dialog-title">备份创建成功</div></template>
      <div class="dialog-body">
        <p>备份名称：{{ backupResult.name }}</p>
        <p>备份时间：{{ backupResult.time }}</p>
        <p>文件大小：{{ backupResult.size }}</p>
        <p>存储位置：本地服务器/云存储</p>
      </div>
      <template #footer>
        <div class="dialog-btns">
          <el-button class="btn-blue" @click="downloadLatestBackup">下载备份</el-button>
          <el-button class="btn-blue" @click="backupSuccessVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="exportConfigVisible" width="380px" align-center>
      <template #header><div class="dialog-title">导出数据</div></template>
      <div class="dialog-body">
        <p>数据类型</p>
        <el-checkbox-group v-model="exportTypes">
          <el-checkbox label="失物招领记录" />
          <el-checkbox label="用户信息" />
          <el-checkbox label="操作日志" />
          <el-checkbox label="系统配置" />
          <el-checkbox label="认领记录" />
          <el-checkbox label="违规记录" />
        </el-checkbox-group>
        <p class="mt8">时间范围</p>
        <div class="range-row">
          <span>从</span>
          <el-input v-model="exportFrom" />
          <span>到</span>
          <el-input v-model="exportTo" />
        </div>
        <p class="mt8">导出文件格式</p>
        <el-radio-group v-model="exportFormat">
          <el-radio label="Excel（.xlsx）" />
          <el-radio label="CSV（.csv）" />
          <el-radio label="JSON（.json）" />
        </el-radio-group>
        <p class="mt8">预计大小：{{ exportEstimatedSize }}</p>
      </div>
      <template #footer>
        <div class="dialog-btns">
          <el-button class="btn-blue" @click="exportConfigVisible = false">取消</el-button>
          <el-button class="btn-blue" @click="startExport">确认导出</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="exportProgressVisible" width="380px" align-center :show-close="false">
      <template #header><div class="dialog-title">正在导出数据</div></template>
      <div class="dialog-body">
        <p>数据类型：{{ exportTypes.join('、') || '未选择' }}</p>
        <p>时间范围：{{ exportFrom }} - {{ exportTo }}</p>
        <p>预计大小：{{ exportEstimatedSize }}</p>
        <el-progress :percentage="exportProgress" :show-text="false" />
        <p>当前状态：进行中 {{ exportProgress }}%</p>
        <p>系统正在生成导出文件</p>
      </div>
    </el-dialog>

    <el-dialog v-model="exportSuccessVisible" width="380px" align-center>
      <template #header><div class="dialog-title">导出数据成功</div></template>
      <div class="dialog-body">
        <p>文件名称：{{ exportResult.fileName }}</p>
        <p>记录数量：{{ exportResult.count }} 条</p>
        <p>文件大小：{{ exportResult.size }}</p>
        <p>生成时间：{{ exportResult.time }}</p>
      </div>
      <template #footer>
        <div class="dialog-btns">
          <el-button class="btn-blue" @click="downloadExportFile">立即下载</el-button>
          <el-button class="btn-blue">稍后下载</el-button>
          <el-button class="btn-blue" @click="exportSuccessVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" width="920px" align-center>
      <template #header><div class="dialog-title dialog-title-dark">历史记录</div></template>
      <el-table :data="historyRows" size="small" :row-class-name="getHistoryRowClass">
        <el-table-column prop="time" label="时间" width="120" />
        <el-table-column prop="type" label="类型" width="70" />
        <el-table-column prop="size" label="大小" width="80" />
        <el-table-column prop="scope" label="数据类型" />
        <el-table-column prop="duration" label="耗时" width="90" />
        <el-table-column prop="status" label="状态" width="70" />
        <el-table-column label="操作" width="140">
          <template #default="{ row, $index }">
            <a href="#" class="op-blue" @click.prevent="handleHistoryOp('下载', row, $index)">下载</a>
            <a href="#" class="op-orange" @click.prevent="handleHistoryOp('还原', row, $index)">还原</a>
            <a href="#" class="op-red" @click.prevent="handleHistoryOp('删除', row, $index)">删除</a>
          </template>
        </el-table-column>
      </el-table>
      <div class="history-footer">
        <span>显示第 1 到 {{ Math.min(10, historyRows.length) }} 条，共 {{ historyRows.length }} 条记录</span>
        <el-pagination :total="historyRows.length" :page-size="10" layout="prev, pager, next" background />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 页面注释：DataManagement 页面的状态管理、交互处理与接口调用逻辑。
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { cleanupExpiredData } from '@/api/super'
import { Coin, DeleteFilled, Document, Opportunity, RefreshLeft } from '@element-plus/icons-vue'

const keepRecent3Months = ref(true)
const cleaning = ref(false)
const backupWorking = ref(false)
const exportWorking = ref(false)

const backupConfirmVisible = ref(false)
const backupProgressVisible = ref(false)
const backupSuccessVisible = ref(false)
const backupProgress = ref(46)

const exportConfigVisible = ref(false)
const exportProgressVisible = ref(false)
const exportSuccessVisible = ref(false)
const exportProgress = ref(23)

const historyVisible = ref(false)

const exportTypes = ref(['失物招领记录', '用户信息', '操作日志'])
const exportFrom = ref('2026.1.12')
const exportTo = ref('2026.1.13')
const exportFormat = ref('Excel（.xlsx）')

const latestBackup = ref<{ time: string; size: string } | null>(null)
const backupResult = ref({ name: '', time: '', size: '' })
const exportResult = ref({ fileName: '', count: 0, size: '', time: '' })

const latestBackupLabel = computed(() => {
  if (!latestBackup.value) return '最近备份：暂无'
  return `最近备份：${latestBackup.value.time} | 文件大小：${latestBackup.value.size}`
})

const exportEstimatedSize = computed(() => {
  const mb = Math.max(4, Math.round((exportTypes.value.length * 2.6 + 3.2) * 10) / 10)
  return `${mb}MB`
})

const historyRows = ref(
  Array.from({ length: 6 }).map((_, idx) => ({
    id: idx + 1,
    time: `2026.1.${13 - idx} 13:00`,
    type: idx % 2 === 0 ? '导出' : '备份',
    size: `${(10 + idx * 1.8).toFixed(1)}MB`,
    scope: idx % 2 === 0 ? '失物招领记录、认领记录' : '全量系统数据',
    duration: `${2 + idx}分${20 + idx}秒`,
    status: '成功',
    deleted: false,
  }))
)

function formatNow() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pushHistory(type: '备份' | '导出', size: string, scope: string, duration = '1分36秒') {
  historyRows.value.unshift({
    id: Date.now(),
    time: formatNow(),
    type,
    size,
    scope,
    duration,
    status: '成功',
    deleted: false,
  })
}

function startBackup() {
  if (backupWorking.value) return
  backupWorking.value = true
  backupProgress.value = 22
  backupConfirmVisible.value = false
  backupProgressVisible.value = true
  setTimeout(() => {
    const now = formatNow()
    const size = `${(Math.random() * 60 + 90).toFixed(1)}MB`
    backupResult.value = {
      name: `backup_${now.slice(0, 10).replace(/-/g, '_')}_${Math.floor(Math.random() * 900 + 100)}`,
      time: now,
      size,
    }
    latestBackup.value = { time: now, size }
    pushHistory('备份', size, '全量系统数据')
    backupProgressVisible.value = false
    backupSuccessVisible.value = true
    backupWorking.value = false
  }, 900)
}

function startExport() {
  if (exportWorking.value) return
  exportWorking.value = true
  exportProgress.value = 16
  exportConfigVisible.value = false
  exportProgressVisible.value = true
  setTimeout(() => {
    const now = formatNow()
    const ext = exportFormat.value.includes('CSV') ? 'csv' : exportFormat.value.includes('JSON') ? 'json' : 'xlsx'
    const count = 800 + Math.floor(Math.random() * 900)
    const size = exportEstimatedSize.value
    exportResult.value = {
      fileName: `records_${now.slice(0, 10).replace(/-/g, '')}.${ext}`,
      count,
      size,
      time: now,
    }
    pushHistory('导出', size, exportTypes.value.join('、') || '未指定范围')
    exportProgressVisible.value = false
    exportSuccessVisible.value = true
    exportWorking.value = false
  }, 900)
}

async function handleCleanup() {
  if (cleaning.value) return
  cleaning.value = true
  try {
    await cleanupExpiredData({ days: keepRecent3Months.value ? 90 : 30 })
    ElMessage.success('清理完成')
  } catch {
    ElMessage.error('清理失败')
  } finally {
    cleaning.value = false
  }
}

function downloadLatestBackup() {
  ElMessage.success('备份下载任务已开始')
}

function downloadExportFile() {
  ElMessage.success('导出文件下载已开始')
}

function handleHistoryOp(action: string, row: any, index: number) {
  if (!row) return
  if (action === '下载') {
    if (row.deleted) {
      ElMessage.warning('该记录已删除，请先还原')
      return
    }
    ElMessage.success(`${row.type}文件下载已开始`)
    return
  }
  if (action === '还原') {
    row.deleted = false
    ElMessage.success('已提交还原任务')
    return
  }
  row.deleted = true
  ElMessage.success('历史记录已删除')
}

function getHistoryRowClass({ row }: { row: any }) {
  return row?.deleted ? 'history-row-deleted' : ''
}
</script>

<style scoped>
.data-page { background: #fdf6ec; border-radius: 10px; padding: 14px; }
.block { background: #fff; border: 1px solid #ececec; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
.block-title { margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 700; }
.top-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.mini-card { border: 1px solid #ececec; border-radius: 8px; padding: 12px; background: #fff; }
.mini-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.mini-icon { width: 30px; height: 30px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.mini-icon.orange { color: #ff8a1f; background: #fff2e5; }
.mini-icon.blue { color: #3b82f6; background: #eaf2ff; }
.mini-icon.green { color: #22c55e; background: #e8f9ef; }
.mini-icon.yellow { color: #eab308; background: #fff8dd; }
.mini-icon.purple { color: #9333ea; background: #f4eaff; }
.mini-title { margin: 0; font-size: 15px; font-weight: 700; color: #1f2937; }
.mini-desc { margin: 2px 0 0 0; font-size: 12px; color: #4b5563; }
.btn-orange, .btn-blue, .btn-gray, .btn-red {
  width: 100%;
  margin-top: 4px;
  box-shadow: none;
}
.btn-orange { background: #e6a23c; border-color: #e6a23c; color: #fff; }
.btn-blue { background: #409eff; border-color: #409eff; color: #fff; }
.btn-gray { background: #d9dde3; border-color: #d9dde3; color: #374151; }
.btn-red { background: #f56c6c; border-color: #f56c6c; color: #fff; }
.btn-orange:hover, .btn-orange:focus { background: #d7942f; border-color: #d7942f; color: #fff; }
.btn-blue:hover, .btn-blue:focus { background: #5b76a5; border-color: #5b76a5; color: #fff; }
.btn-gray:hover, .btn-gray:focus { background: #cfd5dc; border-color: #cfd5dc; color: #374151; }
.btn-red:hover, .btn-red:focus { background: #ad6666; border-color: #ad6666; color: #fff; }
.latest { margin-top: 10px; padding: 10px 0 0 0; border-top: 1px solid #ececec; font-size: 13px; color: #374151; font-weight: 500; }
.clean-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.clean-card { border: 1px solid #ececec; border-radius: 8px; padding: 12px; background: #fff; }
.danger { color: #dc2626; font-weight: 700; }
.tips { margin: 8px 0 0 16px; padding: 0; color: #374151; font-size: 13px; line-height: 1.6; }
.dialog-title { text-align: center; font-size: 18px; font-weight: 700; }
.dialog-title-dark { color: #111827; }
.dialog-body { font-size: 14px; color: #1f2937; line-height: 1.8; }
.dialog-btns { display: flex; justify-content: center; gap: 12px; }
.mt8 { margin-top: 8px; }
.range-row { display: flex; align-items: center; gap: 6px; }
.history-footer { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #374151; }
.op-blue { color: #6366f1; margin-right: 8px; text-decoration: none; }
.op-orange { color: #f59e0b; margin-right: 8px; text-decoration: none; }
.op-red { color: #ce6c6c; text-decoration: none; }
:deep(.history-row-deleted td) {
  background: #f4f5f7 !important;
  color: #b6bcc8 !important;
}
:deep(.history-row-deleted .op-blue),
:deep(.history-row-deleted .op-red) {
  color: #b6bcc8 !important;
  pointer-events: none;
}
:deep(.history-row-deleted .op-orange) {
  color: #f59e0b !important;
  pointer-events: auto;
}
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #e6a23c; }
:deep(.el-input__inner),
:deep(.el-checkbox__label),
:deep(.el-radio__label),
:deep(.el-table th),
:deep(.el-table td) { color: #1f2937; }
@media (max-width: 960px) {
  .top-grid, .clean-grid { grid-template-columns: 1fr; }
}
</style>





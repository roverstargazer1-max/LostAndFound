<template>
  <div class="feedback-page">
    <div class="page-header">
      <h2 class="page-title">反馈中心</h2>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="filterStatus" @change="handleFilterChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="pending">待处理</el-radio-button>
        <el-radio-button label="resolved">已处理</el-radio-button>
      </el-radio-group>
    </div>

    <div class="table-wrapper">
      <el-table
        :data="feedbackList"
        v-loading="loading"
        stripe
        :header-cell-style="{ background: '#f5efe5', color: '#3f4754', fontWeight: 'bold' }"
        style="width: 100%"
      >
        <el-table-column label="ID" width="70" align="center">
          <template #default="{ row }">{{ row.ID || row.id }}</template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'bug'" type="danger" size="small">Bug</el-tag>
            <el-tag v-else-if="row.type === 'complaint'" type="warning" size="small">投诉</el-tag>
            <el-tag v-else type="info" size="small">{{ row.type || '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="140" align="center">
          <template #default="{ row }">{{ row.user?.name || row.user?.username || row.username || '--' }}</template>
        </el-table-column>
        <el-table-column label="联系方式" width="140" align="center">
          <template #default="{ row }">{{ row.contact || '--' }}</template>
        </el-table-column>
        <el-table-column label="内容" min-width="280">
          <template #default="{ row }"><span class="feedback-content">{{ row.content || '--' }}</span></template>
        </el-table-column>
        <el-table-column label="时间" width="170" align="center">
          <template #default="{ row }">{{ row.CreatedAt ? new Date(row.CreatedAt).toLocaleString('zh-CN') : '--' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'resolved' || row.reply" type="success" size="small">已处理</el-tag>
            <el-tag v-else type="warning" size="small">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="回复" min-width="200">
          <template #default="{ row }">
            <span v-if="row.reply" class="reply-text">{{ row.reply }}</span>
            <span v-else style="color: #ccc;">--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="warning" plain size="small" round :disabled="Boolean(row.reply)" @click="openReply(row)">
              回复
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="fetchFeedbacks"
      />
    </div>

    <el-dialog v-model="replyVisible" title="回复反馈" width="520px" top="20vh">
      <div v-if="currentFeedback" class="reply-dialog">
        <div class="reply-original">
          <p><strong>用户：</strong>{{ currentFeedback.user?.name || currentFeedback.user?.username || '--' }}</p>
          <p><strong>类型：</strong>{{ currentFeedback.type || '其他' }}</p>
          <p><strong>联系方式：</strong>{{ currentFeedback.contact || '--' }}</p>
          <p><strong>内容：</strong></p>
          <div class="reply-original-content">{{ currentFeedback.content }}</div>
        </div>
        <el-input
          v-model="replyContent"
          type="textarea"
          :rows="4"
          placeholder="请输入回复内容"
          maxlength="500"
          show-word-limit
        />
      </div>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="warning" :loading="replyLoading" @click="handleReply">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 页面注释：FeedbackCenter 页面的状态管理、交互处理与接口调用逻辑。
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFeedbacks, replyFeedback } from '@/api/super'

const loading = ref(false)
const replyLoading = ref(false)
const feedbackList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterStatus = ref('')

const replyVisible = ref(false)
const currentFeedback = ref<any>(null)
const replyContent = ref('')

async function fetchFeedbacks() {
  loading.value = true
  try {
    const res = await getFeedbacks({
      page: currentPage.value,
      pageSize: pageSize.value,
      status: filterStatus.value || undefined,
    })
    const resData = res.data?.data ?? res.data ?? {}
    feedbackList.value = resData.list ?? []
    total.value = resData.total ?? 0
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '获取反馈失败'
    ElMessage.error(errMsg)
    feedbackList.value = []
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  currentPage.value = 1
  fetchFeedbacks()
}

function openReply(row: any) {
  currentFeedback.value = row
  replyContent.value = row.reply || ''
  replyVisible.value = true
}

async function handleReply() {
  if (replyLoading.value) return
  if (!currentFeedback.value) {
    ElMessage.warning('未选择反馈记录')
    return
  }
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  replyLoading.value = true
  try {
    const id = currentFeedback.value.ID || currentFeedback.value.id
    if (!id) {
      ElMessage.warning('反馈ID无效')
      return
    }
    await replyFeedback(id, { reply: replyContent.value })
    ElMessage.success('回复成功')
    replyVisible.value = false
    replyContent.value = ''
    fetchFeedbacks()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : '回复失败'
    ElMessage.error(errMsg)
  } finally {
    replyLoading.value = false
  }
}

onMounted(() => {
  fetchFeedbacks()
})
</script>

<style scoped>
.feedback-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: bold; color: #374151; margin: 0; }
.filter-bar { margin-bottom: 20px; }
.table-wrapper { background: #fff; border-radius: 8px; overflow: hidden; }
.pagination-wrapper { display: flex; justify-content: center; margin-top: 24px; }

.feedback-content {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13px;
  color: #333;
}
.reply-text { font-size: 13px; color: #4f8f60; }

.reply-dialog { display: flex; flex-direction: column; gap: 16px; }
.reply-original { background: #f7f4ee; border-radius: 8px; padding: 16px; }
.reply-original p { margin: 4px 0; font-size: 14px; color: #333; }
.reply-original-content {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
  margin-top: 8px;
}
</style>





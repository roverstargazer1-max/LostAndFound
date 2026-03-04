<template>
	<div class="profile-page">
		<el-card class="profile-top-card" shadow="never">
			<input ref="avatarInputRef" type="file" accept="image/*" class="avatar-file-input" @change="handleAvatarInputChange" />
			<div class="profile-top">
				<div class="avatar-block">
					<el-avatar :size="100" class="avatar-circle">
						<img v-if="profile.avatar" :src="profile.avatar" alt="用户头像" />
            <template v-else>
              <el-icon class="default-avatar-icon"><UserFilled /></el-icon>
            </template>
					</el-avatar>
					<div class="avatar-actions">
						<el-button style="margin-left: 12px;" class="pill-btn" round @click="handleStaticAction('修改头像')">修改头像</el-button>
						<el-button class="pill-btn" round @click="handleStaticAction('修改昵称')">
							{{ displayName }}
							<el-icon class="btn-icon"><EditPen /></el-icon>
						</el-button>
						<el-button class="pill-btn" round @click="handleLogout">退出登录</el-button>
					</div>
				</div>
			</div>
		</el-card>

		<el-card ref="publishSectionRef" class="profile-main-card" shadow="never">
			<div class="toolbar-top">
				<div class="toolbar-right">
					<span class="meta-link active">我的发布 {{ total }}</span>
					<el-link type="info" :underline="false" @click="scrollToPassword">修改密码</el-link>
					<el-link type="info" :underline="false" @click="scrollToFeedback">反馈意见</el-link>
				</div>
			</div>

			<div class="toolbar-actions">
				<el-button type="warning" class="manage-btn" @click="openManagePublishedDialog">管理我发布的帖子</el-button>
				<el-button type="warning" class="manage-btn" @click="openManageClaimsDialog">管理我申请的认领</el-button>
			</div>

			<div class="status-tabs">
				<button
					v-for="option in statusOptions"
					:key="option.value || 'all'"
					class="status-pill"
					:class="{ active: currentStatus === option.value }"
					@click="changeStatus(option.value)"
				>
					{{ option.label }}
				</button>
			</div>

			<div v-loading="loading" class="publish-list">
				<el-empty v-if="myItems.length === 0" description="暂无发布记录" />
				<div v-else class="card-grid">
					<div v-for="item in myItems" :key="item.id" class="item-card" @click="openItemDetail(item)">
						<div class="card-head">
							<div class="row"><span class="label">物品名称:</span><span>{{ item.title }}</span></div>
							<div class="row"><span class="label">{{ item.typeLabel }}时间:</span><span>{{ item.time || '-' }}</span></div>
							<div class="row"><span class="label">{{ item.typeLabel }}地点:</span><span>{{ item.location || '-' }}</span></div>
						</div>
						<div class="card-body">
							<div class="tags-col">
								<el-tag size="small" effect="plain">校区: {{ item.campus || '未知' }}</el-tag>
								<el-tag size="small" effect="plain" type="warning">物品类型: {{ item.category || '未知' }}</el-tag>
							</div>
							<div class="img-col">
								<el-image :src="item.img1" fit="cover" class="item-image">
									<template #error>
										<div class="empty-img">暂无图片</div>
									</template>
								</el-image>
							</div>
						</div>
						<div class="card-foot">
							<span class="created">{{ item.createdAt || '-' }}</span>
							<span class="status" :class="statusClass(item.statusLabel)">{{ item.statusLabel }}</span>
						</div>
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

			<div ref="passwordSectionRef" class="section-block">
				<div class="section-title">修改密码</div>
				<el-form
					ref="passwordFormRef"
					:model="passwordForm"
					:rules="rules"
					label-width="100px"
				>
					<el-form-item label="原密码" prop="old_password">
						<el-input v-model="passwordForm.old_password" type="password" show-password />
					</el-form-item>
					<el-form-item label="新密码" prop="new_password">
						<el-input v-model="passwordForm.new_password" type="password" show-password />
					</el-form-item>
					<el-form-item label="确认新密码" prop="confirm_password">
						<el-input v-model="passwordForm.confirm_password" type="password" show-password />
					</el-form-item>
					<el-form-item>
						<el-button type="primary" :loading="submitting" @click="handleChangePassword">保存新密码</el-button>
					</el-form-item>
				</el-form>
			</div>


			<div ref="feedbackSectionRef" class="section-block">
				<div class="section-title">反馈与投诉</div>
        <div class="feedback-type-wrapper">
          <span class="fb-label">功能选择</span>
          <div class="fb-type-options">
            <div
              class="fb-option"
              :class="{ active: feedbackType === '反馈' }"
              @click="feedbackType = '反馈'"
            >
              <div class="radio-circle"></div>
              <span>反馈</span>
            </div>
            <div
              class="fb-option"
              :class="{ active: feedbackType === '投诉' }"
              @click="feedbackType = '投诉'"
            >
              <div class="radio-circle"></div>
              <span>投诉</span>
            </div>
          </div>
        </div>

        <div class="feedback-type-wrapper">
          <span class="fb-label">反馈类型</span>
          <div class="fb-type-options">
            <div
              class="fb-option"
              :class="{ active: feedbackCategory === '产品建议' }"
              @click="feedbackCategory = '产品建议'"
            >
              <div class="radio-circle"></div>
              <span>产品建议</span>
            </div>
            <div
              class="fb-option"
              :class="{ active: feedbackCategory === '功能故障' }"
              @click="feedbackCategory = '功能故障'"
            >
              <div class="radio-circle"></div>
              <span>功能故障</span>
            </div>
             <div
              class="fb-option"
              :class="{ active: feedbackCategory === '其他问题' }"
              @click="feedbackCategory = '其他问题'"
            >
              <div class="radio-circle"></div>
              <span>其他问题</span>
            </div>
          </div>
        </div>

        <div class="feedback-input-wrapper">

          <span class="fb-label" style="margin-top: 8px;">问题描述</span>
          <el-input
            v-model="feedbackText"
            type="textarea"
            :rows="6"
            maxlength="500"
            show-word-limit
            placeholder="请输入六个字以上的文字描述"
            class="custom-textarea"
          />
        </div>


				<div class="feedback-actions">
					<el-button type="warning" class="submit-btn" :loading="feedbackSubmitting" @click="handleFeedbackSubmit">提交</el-button>
				</div>
			</div>

		</el-card>

		<el-dialog v-model="detailVisible" title="帖子详情" width="760px" destroy-on-close>
			<el-form :model="editForm" label-width="92px">
				<el-form-item label="物品名称">
					<el-input v-model="editForm.title" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item label="校区">
					<el-input v-model="editForm.campus" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item label="物品类型">
					<el-input v-model="editForm.category" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item :label="`${activeItem?.typeLabel || '丢失'}时间`">
					<el-input v-model="editForm.time" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item :label="`${activeItem?.typeLabel || '丢失'}地点`">
					<el-input v-model="editForm.location" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item label="联系人">
					<el-input v-model="editForm.contact_name" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item label="联系方式">
					<el-input v-model="editForm.contact_phone" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item label="物品特征">
					<el-input v-model="editForm.description" type="textarea" :rows="4" :disabled="!canEditCurrent" />
				</el-form-item>
				<el-form-item label="状态">
					<el-tag>{{ activeItem?.statusLabel || '-' }}</el-tag>
				</el-form-item>
			</el-form>
			<div class="dialog-images">
				<el-image v-for="(img, index) in detailImages" :key="`${img}-${index}`" :src="img" fit="cover" class="dialog-img" />
				<span v-if="detailImages.length === 0" class="dialog-empty-img">暂无相关图片</span>
			</div>
			<template #footer>
				<div class="dialog-footer-actions">
					<el-text v-if="!canEditCurrent" type="info">仅待审核、已通过、已驳回的帖子可修改并重新发送</el-text>
					<el-button @click="detailVisible = false">关闭</el-button>
					<el-button type="warning" :disabled="!canEditCurrent" :loading="resubmitLoading" @click="handleResubmit">修改并重新发送</el-button>
				</div>
			</template>
		</el-dialog>

		<el-dialog v-model="managePublishedVisible" width="92%" top="6vh" destroy-on-close class="manage-dialog" align-center>
			<template #header>
				<div class="manage-title">管理我发布的帖子</div>
			</template>
			<el-table :data="managePublishedList" v-loading="managePublishedLoading" class="manage-table" border>
				<el-table-column label="#" width="56" align="center">
					<template #default="scope">{{ publishRowNo(scope.$index) }}</template>
				</el-table-column>
				<el-table-column prop="title" label="物品名称" min-width="110" />
				<el-table-column prop="createdAt" label="发布时间" min-width="170" />
				<el-table-column label="图片" min-width="160">
					<template #default="scope">
						<div class="table-images" v-if="scope.row.images.length">
							<el-image v-for="(img, idx) in scope.row.images.slice(0, 2)" :key="`${img}-${idx}`" :src="img" fit="cover" class="table-img" />
						</div>
						<span v-else>无</span>
					</template>
				</el-table-column>
				<el-table-column prop="statusLabel" label="帖子状态" min-width="100" />
				<el-table-column prop="typeLabel" label="帖子类型" min-width="96" />
				<el-table-column prop="claimStatusLabel" label="招领状态" min-width="100" />
				<el-table-column label="操作" min-width="180" fixed="right">
					<template #default="scope">
						<div class="table-actions">
							<ConfirmButton
								v-if="scope.row.canDelete"
								class="table-confirm-btn"
								label="删除"
								title="确认删除"
								message="确定删除这条发布记录吗？删除后不可恢复。"
								confirm-text="确认删除"
								cancel-text="取消"
								@confirm="handleDeletePublished(scope.row)"
							/>
							<el-button v-else size="small" round disabled>删除</el-button>
							<ConfirmButton
                class="table-confirm-btn"
                label="取消"
                title="确认取消发布"
                message="确定要取消发布吗？取消后帖子将不可见，但不会删除记录。"
                confirm-text="确认取消"
                cancel-text="取消"
								:type="(!scope.row.canCancel || scope.row.statusLabel === '已取消' || cancellingIds.includes(scope.row.id)) ? 'info' : 'warning'"
								:disabled="!scope.row.canCancel || scope.row.statusLabel === '已取消' || cancellingIds.includes(scope.row.id)"
								@confirm="handleCancelPublished(scope.row)"
							>取消</ConfirmButton>
							<el-button size="small" round class="detail-btn" :disabled="scope.row.statusLabel !== '待审核' && scope.row.statusLabel !== '已通过'" @click="openPublishedDetail(scope.row)">修改</el-button>
						</div>
					</template>
				</el-table-column>
			</el-table>
			<div class="dialog-pager">
				<el-pagination
					layout="prev, pager, next"
					:total="managePublishedTotal"
					:page-size="managePublishedPageSize"
					:current-page="managePublishedPageNum"
					@current-change="handleManagePublishedPageChange"
				/>
			</div>
		</el-dialog>

		<el-dialog v-model="manageClaimsVisible" width="92%" top="6vh" destroy-on-close class="manage-dialog" align-center>
			<template #header>
				<div class="manage-title">管理我申请的认领</div>
			</template>
			<el-table :data="manageClaimsList" v-loading="manageClaimsLoading" class="manage-table" border>
				<el-table-column label="#" width="56" align="center">
					<template #default="scope">{{ claimRowNo(scope.$index) }}</template>
				</el-table-column>
				<el-table-column prop="title" label="物品名称" min-width="110" />
				<el-table-column prop="createdAt" label="发布时间" min-width="170" />
				<el-table-column label="图片" min-width="160">
					<template #default="scope">
						<div class="table-images" v-if="scope.row.images.length">
							<el-image v-for="(img, idx) in scope.row.images.slice(0, 2)" :key="`${img}-${idx}`" :src="img" fit="cover" class="table-img" />
						</div>
						<span v-else>无</span>
					</template>
				</el-table-column>
				<el-table-column prop="claimStatusLabel" label="认领进度" min-width="100" />
				<el-table-column prop="typeLabel" label="帖子类型" min-width="96" />
				<el-table-column label="原因" min-width="120">
					<template #default="scope">
						<span :class="{ 'reason-link': scope.row.reasonText !== '/' }">{{ scope.row.reasonText }}</span>
					</template>
				</el-table-column>
				<el-table-column label="操作" min-width="240" fixed="right">
					<template #default="scope">
						<div class="table-actions">
							<el-button size="small" round :disabled="!scope.row.canDelete">删除</el-button>
							<el-button size="small" round type="warning" :disabled="!scope.row.canTalk" @click="handleTalkToPeer(scope.row)">沟通</el-button>
							<el-button size="small" round class="detail-btn" @click="openClaimDetail(scope.row)">详情</el-button>
						</div>
					</template>
				</el-table-column>
			</el-table>
			<div class="dialog-pager">
				<el-pagination
					layout="prev, pager, next"
					:total="manageClaimsTotal"
					:page-size="manageClaimsPageSize"
					:current-page="manageClaimsPageNum"
					@current-change="handleManageClaimsPageChange"
				/>
			</div>
		</el-dialog>

		<el-dialog v-model="claimDetailVisible" title="认领详情" width="760px" destroy-on-close>
			<div v-loading="claimDetailLoading" class="claim-detail-wrap">
				<el-empty v-if="!claimDetailData" description="暂无认领详情" />
				<template v-else>
					<el-descriptions :column="2" border>
						<el-descriptions-item label="认领ID">{{ claimDetailData.ID || '-' }}</el-descriptions-item>
						<el-descriptions-item label="认领状态">{{ normalizeClaimStatus(claimDetailData.status) }}</el-descriptions-item>
						<el-descriptions-item label="物品名称">{{ claimDetailData.item?.title || '-' }}</el-descriptions-item>
						<el-descriptions-item label="帖子类型">{{ resolveTypeLabel(claimDetailData.item?.type) === '丢失' ? '失丢贴' : '拾取贴' }}</el-descriptions-item>
						<el-descriptions-item label="校区">{{ claimDetailData.item?.campus || '-' }}</el-descriptions-item>
						<el-descriptions-item label="物品类别">{{ claimDetailData.item?.category || '-' }}</el-descriptions-item>
						<el-descriptions-item label="地点">{{ claimDetailData.item?.location || '-' }}</el-descriptions-item>
						<el-descriptions-item label="时间">{{ claimDetailData.item?.time || '-' }}</el-descriptions-item>
						<el-descriptions-item label="申请人">{{ claimDetailData.claimant?.name || claimDetailData.claimant?.nickname || claimDetailData.claimant?.username || '-' }}</el-descriptions-item>
						<el-descriptions-item label="申请人电话">{{ claimDetailData.claimant?.phone || '-' }}</el-descriptions-item>
						<el-descriptions-item label="发布者">{{ claimDetailData.item?.publisher?.name || claimDetailData.item?.publisher?.nickname || claimDetailData.item?.publisher?.Username || '-' }}</el-descriptions-item>
						<el-descriptions-item label="发布时间">{{ formatTime(claimDetailData.item?.CreatedAt) || '-' }}</el-descriptions-item>
						<el-descriptions-item label="认领创建时间">{{ formatTime(claimDetailData.CreatedAt) || '-' }}</el-descriptions-item>
						<el-descriptions-item label="认领更新时间">{{ formatTime(claimDetailData.UpdatedAt) || '-' }}</el-descriptions-item>
					</el-descriptions>

					<div class="claim-detail-block">
						<div class="claim-detail-title">认领说明</div>
						<div class="claim-detail-text">{{ claimDetailData.proof || '-' }}</div>
					</div>

					<div class="claim-detail-block">
						<div class="claim-detail-title">驳回原因</div>
						<div class="claim-detail-text">{{ claimDetailData.reject_reason || '-' }}</div>
					</div>

					<div class="dialog-images">
						<el-image v-for="(img, index) in claimDetailImages" :key="`${img}-${index}`" :src="img" fit="cover" class="dialog-img" />
						<span v-if="claimDetailImages.length === 0" class="dialog-empty-img">暂无相关图片</span>
					</div>
				</template>
			</div>
			<template #footer>
				<el-button @click="claimDetailVisible = false">关闭</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="nicknameDialogVisible" title="修改昵称" width="420px" destroy-on-close>
			<el-form label-width="80px">
				<el-form-item label="新昵称">
					<el-input v-model="nicknameInput" maxlength="20" show-word-limit placeholder="请输入昵称" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="nicknameDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="nicknameSaving" @click="submitNicknameUpdate">保存</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="avatarDialogVisible" title="修改头像" width="460px" destroy-on-close @closed="resetAvatarDialogState">
			<div class="avatar-dialog-content">
				<el-avatar :size="120" class="avatar-circle">
					<img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="头像预览" />
					<template v-else>
						<el-icon class="default-avatar-icon"><UserFilled /></el-icon>
					</template>
				</el-avatar>
				<el-text type="info">支持图片格式，大小不超过 5MB</el-text>
			</div>
			<template #footer>
				<el-button @click="avatarDialogVisible = false">取消</el-button>
				<el-button @click="pickAvatarFile">选择图片</el-button>
				<el-button type="primary" :loading="avatarSaving" :disabled="!pendingAvatarFile" @click="submitAvatarUpdate">保存</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, UserFilled } from '@element-plus/icons-vue'
import { updateUserInfoApi, changePasswordApi, getMyClaimDetailApi, getMyClaimsApi, getMyItemsApi, getUserInfoApi, logoutApi, submitFeedbackApi, type FeedbackType, type MyClaimItem, type MyItem, type MyItemStatus } from '@/api/user'
import { deleteMyItemApi, updateMyItemApi } from '@/api/Publish'
import { useUserStore } from '@/stores/user'
import { useChatSessionStore } from '@/stores/chatSession'
import ConfirmButton from '@/components/ConfirmButton.vue'
import { uploadImagesAndGetUrls } from '@/utils/imageUpload'
import { normalizeResourceUrl } from '@/utils/url'
import {cancelMyItemApi} from "@/api/Publish";
const userStore = useUserStore()
const chatSessionStore = useChatSessionStore()
const router = useRouter()

const profile = reactive({
	username: '',
	name: '',
	phone: '',
  avatar: normalizeResourceUrl(userStore.avatar) || ''
})

const displayName = computed(() => userStore.nickname || profile.name || userStore.username || '未命名用户')

type ViewMyItem = MyItem & {
	id: number
	title: string
	createdAt: string
	typeLabel: string
	statusLabel: string
}

type ManagePublishedRow = {
	id: number
	apiId: number
	title: string
	createdAt: string
	images: string[]
	statusLabel: string
	typeLabel: string
	claimStatusLabel: string
	canDelete: boolean
	canCancel: boolean
	viewItem: ViewMyItem
}

type ManageClaimRow = {
	id: number
	claimId: number
	title: string
	createdAt: string
	images: string[]
	claimStatusLabel: string
	typeLabel: string
	reasonText: string
	canModify: boolean
	canDelete: boolean
	canTalk: boolean
}

const loading = ref(false)
const myItems = ref<ViewMyItem[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 6
const currentStatus = ref<MyItemStatus>('')
const feedbackText = ref('')
const feedbackType = ref<'反馈' | '投诉'>('反馈')
const feedbackCategory = ref<'产品建议' | '功能故障' | '其他问题'>('产品建议')

const feedbackSubmitting = ref(false)
const detailVisible = ref(false)
const activeItem = ref<ViewMyItem | null>(null)
const resubmitLoading = ref(false)
const managePublishedVisible = ref(false)
const manageClaimsVisible = ref(false)

const managePublishedLoading = ref(false)
const managePublishedList = ref<ManagePublishedRow[]>([])
const managePublishedPageNum = ref(1)
const managePublishedPageSize = 5
const managePublishedTotal = ref(0)
const deletingPublishedId = ref<number | null>(null)

const manageClaimsLoading = ref(false)
const manageClaimsList = ref<ManageClaimRow[]>([])
const manageClaimsPageNum = ref(1)
const manageClaimsPageSize = 5
const manageClaimsTotal = ref(0)
const claimDetailVisible = ref(false)
const claimDetailLoading = ref(false)
const claimDetailData = ref<MyClaimItem | null>(null)
const nicknameDialogVisible = ref(false)
const nicknameInput = ref('')
const nicknameSaving = ref(false)
const avatarDialogVisible = ref(false)
const avatarSaving = ref(false)
const pendingAvatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')

const editForm = reactive({
	title: '',
	campus: '',
	category: '',
	location: '',
	time: '',
	description: '',
	contact_name: '',
	contact_phone: '',
	img1: '',
	img2: '',
	img3: '',
	img4: ''
})

const publishSectionRef = ref<HTMLElement>()
const passwordSectionRef = ref<HTMLElement>()
const feedbackSectionRef = ref<HTMLElement>()
const avatarInputRef = ref<HTMLInputElement>()

const statusOptions: Array<{ label: string; value: MyItemStatus }> = [
	{ label: '全部类型', value: '' },
	{ label: '待审核', value: 'pending' },
	{ label: '已通过', value: 'approved' },
	{ label: '已匹配', value: 'matched' },
	{ label: '已认领', value: 'archived' },
	{ label: '已驳回', value: 'rejected' },
	{ label: '已取消', value: 'cancelled' }
]

const editableStatuses = ['待审核', '已通过', '已驳回']

const canEditCurrent = computed(() => {
	if (!activeItem.value) return false
	return editableStatuses.includes(activeItem.value.statusLabel)
})

const detailImages = computed(() => {
	return [editForm.img1, editForm.img2, editForm.img3, editForm.img4].filter(Boolean)
})

const claimDetailImages = computed(() => {
	const item = claimDetailData.value?.item
	return collectItemImages(item)
})

const passwordFormRef = ref<FormInstance>()
const submitting = ref(false)
const passwordForm = reactive({
	old_password: '',
	new_password: '',
	confirm_password: ''
})

const rules: FormRules<typeof passwordForm> = {
	old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
	new_password: [
		{ required: true, message: '请输入新密码', trigger: 'blur' },
		{ min: 6, message: '新密码长度至少 6 位', trigger: 'blur' }
	],
	confirm_password: [
		{ required: true, message: '请再次输入新密码', trigger: 'blur' },
		{
			validator: (_, value, callback) => {
				if (value !== passwordForm.new_password) {
					callback(new Error('两次输入的新密码不一致'))
					return
				}
				callback()
			},
			trigger: 'blur'
		}
	]
}

const getHomePathByRole = (role: number) => {
	if (role === 3) return '/super'
	if (role === 2) return '/admin'
	return '/StudentHome'
}

const resolveTypeLabel = (type?: string) => {
	const rawType = String(type || '').toLowerCase()
	if (rawType === 'found' || rawType === 'pick' || rawType === 'picked' || type === '拾取') return '拾取'
	return '丢失'
}

const normalizeStatus = (status?: string | number): string => {
	   if (typeof status === 'number') {
		   if (status === 0) return '待审核'
		   if (status === 1) return '已通过'
		   if (status === 2) return '已匹配'
		   if (status === 3) return '已认领'
		   if (status === 4) return '已驳回'
	   }
	   const raw = String(status || '').trim().toLowerCase()
	   if (!raw) return '待审核'
	   if (raw === '待审核' || raw === 'pending' || raw === 'in' || raw === 'reviewing') return '待审核'
	   if (raw === '已通过' || raw === 'approved' || raw === 'pass' || raw === 'passed') return '已通过'
	   if (raw === '已匹配' || raw === 'matched') return '已匹配'
	   if (raw === '已认领' || raw === 'claimed' || raw === 'archived') return '已认领'
	   if (raw === '已驳回' || raw === 'rejected' || raw === 'reject') return '已驳回'
	   if (raw === '已取消' || raw === 'cancelled' || raw === 'canceled') return '已取消'
	   return String(status)
}

const normalizeClaimStatus = (status?: string | number): string => {
	if (typeof status === 'number') {
		if (status === 0) return '待审核'
		if (status === 1) return '已通过'
		if (status === 2) return '已完成'
		if (status === 3) return '已驳回'
	}
	const raw = String(status || '').trim().toLowerCase()
	if (!raw) return '待审核'
	if (raw === '待审核' || raw === 'pending' || raw === 'in' || raw === 'reviewing') return '待审核'
	if (raw === '已通过' || raw === 'approved' || raw === 'pass' || raw === 'passed') return '已通过'
	if (raw === '已完成' || raw === 'claimed' || raw === 'done' || raw === 'completed' || raw === 'matched') return '已完成'
	if (raw === '已驳回' || raw === 'rejected' || raw === 'reject') return '已驳回'
	if (raw === '已取消' || raw === 'cancelled' || raw === 'canceled') return '已取消'
	if (raw === '已归档' || raw === 'archived') return '已归档'
	return String(status)
}

const hasCodeField = (data?: { code?: number }) => {
	return Number(data?.code) === 200
}

const mapFeedbackTypeToApiType = (type: '反馈' | '投诉'): FeedbackType => {
	return type === '投诉' ? 'complaint' : 'suggestion'
}

const collectItemImages = (item?: MyItem) => {
	return [item?.img1, item?.img2, item?.img3, item?.img4]
		.filter((img): img is string => Boolean(img))
		.map((img) => normalizeResourceUrl(img))
}

const getClaimStatusLabelForPost = (item: MyItem, statusLabel: string) => {
	if (statusLabel === '已认领') return '已认领'
	if (statusLabel === '已驳回') return '待找回'
	if (resolveTypeLabel(item.type) === '丢失') return '待找回'
	return '待认领'
}

const formatTime = (value?: string) => {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return value
	return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const toApiTimeString = (input?: string) => {
	const raw = String(input || '').trim()
	if (!raw) return undefined

	const formatDateToApi = (date: Date) => {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
	}

	if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(raw)) {
		return raw
	}

	const directParsedDate = new Date(raw)
	if (!Number.isNaN(directParsedDate.getTime())) {
		return formatDateToApi(directParsedDate)
	}

	const normalized = raw
		.replace(/年|\//g, '-')
		.replace(/月/g, '-')
		.replace(/日/g, ' ')
		.replace(/[Tt]/g, ' ')
		.replace(/\./g, '-')
		.replace(/时/g, ':')
		.replace(/分/g, ':')
		.replace(/秒/g, '')
		.replace(/\s+/g, ' ')
		.trim()

	const matched = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?)?$/)
	if (!matched) {
		const normalizedParsedDate = new Date(normalized)
		if (!Number.isNaN(normalizedParsedDate.getTime())) {
			return formatDateToApi(normalizedParsedDate)
		}
		return null
	}

	const [, year, month, day, hour = '0', minute = '0', second = '0'] = matched
	const y = Number(year)
	const m = Number(month)
	const d = Number(day)
	const hh = Number(hour)
	const mm = Number(minute)
	const ss = Number(second)

	if (
		!Number.isInteger(y) ||
		!Number.isInteger(m) ||
		!Number.isInteger(d) ||
		!Number.isInteger(hh) ||
		!Number.isInteger(mm) ||
		!Number.isInteger(ss) ||
		m < 1 ||
		m > 12 ||
		d < 1 ||
		d > 31 ||
		hh < 0 ||
		hh > 23 ||
		mm < 0 ||
		mm > 59 ||
		ss < 0 ||
		ss > 59
	) {
		return null
	}

	return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

const fetchMyItems = async () => {
	loading.value = true
	try {
		const queryParams = {
			page_num: pageNum.value,
			page_size: pageSize
		} as { status?: MyItemStatus; page_num: number; page_size: number }
		if (currentStatus.value) {
			queryParams.status = currentStatus.value
		}

		const response = await getMyItemsApi(queryParams)
		if (hasCodeField(response?.data)) {
			const sourceList = response.data?.data?.list
			const list = Array.isArray(sourceList) ? sourceList : []
			myItems.value = list.map((item, index) => {
				const id = Number(item.ID ?? item.id ?? index + 1)
				const statusLabel = normalizeStatus(item.status)
				return {
					...item,
					id,
					title: item.title || (item as MyItem & { tilte?: string }).tilte || '未命名物品',
					img1: normalizeResourceUrl(item.img1),
					img2: normalizeResourceUrl(item.img2),
					img3: normalizeResourceUrl(item.img3),
					img4: normalizeResourceUrl(item.img4),
					createdAt: formatTime(item.CreatedAt || item.UpdatedAt),
					typeLabel: resolveTypeLabel(item.type),
					statusLabel
				}
			})
			total.value = Number(response.data?.data?.total || list.length || 0)
			return
		}
		ElMessage.warning(response?.data?.msg || '获取我的发布失败')
		myItems.value = []
		total.value = 0
	} catch {
		ElMessage.error('获取我的发布失败，请稍后重试')
		myItems.value = []
		total.value = 0
	} finally {
		loading.value = false
	}
}

const changeStatus = (status: MyItemStatus) => {
	if (currentStatus.value === status) return
	currentStatus.value = status
	pageNum.value = 1
	fetchMyItems()
}

const handlePageChange = (page: number) => {
	pageNum.value = page
	fetchMyItems()
}

const scrollToElement = async (el?: HTMLElement) => {
	await nextTick()
	el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const scrollToPassword = () => scrollToElement(passwordSectionRef.value)
const scrollToFeedback = () => scrollToElement(feedbackSectionRef.value)
const scrollToPublish = () => scrollToElement(publishSectionRef.value)

const handleManageClaim = () => {
	router.push('/StudentHome/message/progress')
}

const fetchManagePublishedList = async () => {
	managePublishedLoading.value = true
	try {
		const response = await getMyItemsApi({
			page_num: managePublishedPageNum.value,
			page_size: managePublishedPageSize
		})
		if (!hasCodeField(response?.data)) {
			ElMessage.warning(response?.data?.msg || '获取发布列表失败')
			managePublishedList.value = []
			managePublishedTotal.value = 0
			return
		}

		const list = Array.isArray(response.data?.data?.list) ? response.data.data.list : []
		managePublishedList.value = list.map((item, index) => {
			const id = Number(item.ID ?? item.id ?? index + 1)
			const apiId = Number(item.ID ?? item.id ?? 0)
			const statusLabel = normalizeStatus(item.status)
			const typeLabel = resolveTypeLabel(item.type) === '丢失' ? '失丢贴' : '拾取贴'
			const viewItem: ViewMyItem = {
				...item,
				id,
				title: item.title || (item as MyItem & { tilte?: string }).tilte || '未命名',
				createdAt: formatTime(item.CreatedAt || item.UpdatedAt),
				typeLabel: resolveTypeLabel(item.type),
				statusLabel
			}
			return {
				id,
				apiId,
				title: viewItem.title,
				createdAt: viewItem.createdAt,
				images: collectItemImages(item),
				statusLabel,
				typeLabel,
				claimStatusLabel: getClaimStatusLabelForPost(item, statusLabel),
				canDelete: statusLabel === '待审核',
				canCancel: statusLabel === '已通过',
				viewItem
			}
		})
		managePublishedTotal.value = Number(response.data?.data?.total || list.length || 0)
	} catch {
		ElMessage.error('获取发布列表失败，请稍后重试')
		managePublishedList.value = []
		managePublishedTotal.value = 0
	} finally {
		managePublishedLoading.value = false
	}
}

const fetchManageClaimsList = async () => {
	manageClaimsLoading.value = true
	try {
		const response = await getMyClaimsApi({
			page_num: manageClaimsPageNum.value,
			page_size: manageClaimsPageSize
		})
		if (!hasCodeField(response?.data)) {
			ElMessage.warning(response?.data?.msg || '获取认领列表失败')
			manageClaimsList.value = []
			manageClaimsTotal.value = 0
			return
		}

		const list = Array.isArray(response.data?.data?.list) ? response.data.data.list : []
		manageClaimsList.value = list.map((record: MyClaimItem, index) => {
			const claimStatusLabel = normalizeClaimStatus(record.status)
			const item = record.item || {}
			const rejectReason = item.reject_reason || item.process_method || record.proof || ''
			return {
				id: Number(record.ID ?? index + 1),
				claimId: Number(record.ID ?? 0),
				title: item.title || '未命名',
				createdAt: formatTime(record.CreatedAt || item.CreatedAt),
				images: collectItemImages(item),
				claimStatusLabel,
				typeLabel: resolveTypeLabel(item.type) === '丢失' ? '失丢贴' : '拾取贴',
				reasonText: claimStatusLabel === '已驳回' && rejectReason ? '点详情查看原因' : '/',
				canModify: claimStatusLabel === '待审核',
				canDelete: claimStatusLabel === '待审核',
				canTalk: claimStatusLabel === '已通过'
			}
		})
		manageClaimsTotal.value = Number(response.data?.data?.total || list.length || 0)
	} catch {
		ElMessage.error('获取认领列表失败，请稍后重试')
		manageClaimsList.value = []
		manageClaimsTotal.value = 0
	} finally {
		manageClaimsLoading.value = false
	}
}

const handleTalkToPeer = async (row: ManageClaimRow) => {
	if (!row.claimId) {
		ElMessage.warning('缺少认领ID，无法发起沟通')
		return
	}
	try {
		const response = await getMyClaimDetailApi(row.claimId)
		if (!hasCodeField(response?.data)) {
			ElMessage.warning(response?.data?.msg || '获取认领详情失败')
			return
		}
		const detail = response.data?.data
		const targetId = Number(detail?.peer_user_id || 0)
		if (!targetId) {
			ElMessage.warning('缺少沟通对象信息，无法打开会话')
			return
		}

		const item = detail?.item
		chatSessionStore.ensureSession({
			target_id: targetId,
			target_name: `用户${targetId}`
		})

		manageClaimsVisible.value = false
		router.push({
			path: `/StudentHome/message/chat/${targetId}`,
			query: {
				target_name: `用户${targetId}`,
				item_id: String(item?.ID || item?.id || ''),
				item_name: item?.title || '',
				loss_time: item?.time || '',
				location: item?.location || '',
				img: item?.img1 || '',
				can_confirm: '0'
			}
		})
	} catch {
		ElMessage.error('发起沟通失败，请稍后重试')
	}
}

const openClaimDetail = async (row: ManageClaimRow) => {
	if (!row.claimId) {
		ElMessage.warning('缺少认领ID，无法获取详情')
		return
	}
	claimDetailVisible.value = true
	claimDetailLoading.value = true
	claimDetailData.value = null
	try {
		const response = await getMyClaimDetailApi(row.claimId)
		if (!hasCodeField(response?.data)) {
			ElMessage.warning(response?.data?.msg || '获取认领详情失败')
			return
		}
		claimDetailData.value = response.data?.data || null
	} catch {
		ElMessage.error('获取认领详情失败，请稍后重试')
	} finally {
		claimDetailLoading.value = false
	}
}

const openPublishedDetail = (row: ManagePublishedRow) => {
	managePublishedVisible.value = false
	openItemDetail(row.viewItem)
}

const handleDeletePublished = async (row: ManagePublishedRow) => {
	if (!row.apiId || row.apiId <= 0) {
		ElMessage.warning('无效的帖子ID，无法删除')
		return
	}
	if (deletingPublishedId.value === row.apiId) {
		return
	}

	deletingPublishedId.value = row.apiId
	try {
		const response = await deleteMyItemApi(row.apiId)
		if (!hasCodeField(response?.data)) {
			ElMessage.error(response?.data?.msg || '删除失败')
			return
		}
		ElMessage.success(response?.data?.msg || '删除成功')
		await Promise.all([fetchManagePublishedList(), fetchMyItems()])
	} catch {
		ElMessage.error('删除失败，请稍后重试')
	} finally {
		deletingPublishedId.value = null
	}
}

const cancellingIds = ref<number[]>([])
const handleCancelPublished = async (row: ManagePublishedRow) => {
	if (row.statusLabel === '已取消' || cancellingIds.value.includes(row.id)) return;
	cancellingIds.value.push(row.id);
	try {
		await cancelMyItemApi(row.id);
		// 可根据实际情况刷新列表或更新状态
    if (!hasCodeField({ code: 20000 })) {
      ElMessage.error('取消失败');
      return;
    }
		ElMessage.success('取消成功');
		// 这里建议刷新managePublishedList或单独更新row.statusLabel为'已取消'
		row.statusLabel = '已取消';
	} catch (e) {
		ElMessage.error('取消失败');
	} finally {
		cancellingIds.value = cancellingIds.value.filter(id => id !== row.id);
	}
}

const openManagePublishedDialog = async () => {
	managePublishedVisible.value = true
	managePublishedPageNum.value = 1
	await fetchManagePublishedList()
}

const openManageClaimsDialog = async () => {
	manageClaimsVisible.value = true
	manageClaimsPageNum.value = 1
	await fetchManageClaimsList()
}

const publishRowNo = (index: number) => {
	return (managePublishedPageNum.value - 1) * managePublishedPageSize + index + 1
}

const claimRowNo = (index: number) => {
	return (manageClaimsPageNum.value - 1) * manageClaimsPageSize + index + 1
}

const handleManagePublishedPageChange = (page: number) => {
	managePublishedPageNum.value = page
	fetchManagePublishedList()
}

const handleManageClaimsPageChange = (page: number) => {
	manageClaimsPageNum.value = page
	fetchManageClaimsList()
}

const openNicknameDialog = () => {
	nicknameInput.value = userStore.nickname || ''
	nicknameDialogVisible.value = true
}

const handleAvatarInputChange = async (event: Event) => {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	input.value = ''
	if (!file) return

	if (!file.type.startsWith('image/')) {
		ElMessage.warning('请选择图片文件')
		return
	}

	if (file.size > 5 * 1024 * 1024) {
		ElMessage.warning('头像大小不能超过5MB')
		return
	}

	pendingAvatarFile.value = file
	avatarPreviewUrl.value = URL.createObjectURL(file)
}

const pickAvatarFile = () => {
	avatarInputRef.value?.click()
}

const openAvatarDialog = () => {
	avatarDialogVisible.value = true
	avatarPreviewUrl.value = profile.avatar || ''
}

const resetAvatarDialogState = () => {
	if (avatarPreviewUrl.value.startsWith('blob:')) {
		URL.revokeObjectURL(avatarPreviewUrl.value)
	}
	pendingAvatarFile.value = null
	avatarPreviewUrl.value = ''
}

const submitNicknameUpdate = async () => {
	const trimmedNickname = nicknameInput.value.trim()
	if (!trimmedNickname) {
		ElMessage.warning('昵称不能为空')
		return
	}
	if (trimmedNickname.length > 20) {
		ElMessage.warning('昵称长度不能超过20个字符')
		return
	}

	nicknameSaving.value = true
	try {
		const response = await updateUserInfoApi({ nickname: trimmedNickname })
		if (!hasCodeField(response?.data)) {
			ElMessage.error(response?.data?.msg || '修改昵称失败')
			return
		}

		userStore.setNickname(trimmedNickname)
		nicknameDialogVisible.value = false
		ElMessage.success(response.data.msg || '昵称修改成功')
	} catch {
		ElMessage.error('修改昵称失败，请稍后重试')
	} finally {
		nicknameSaving.value = false
	}
}

const submitAvatarUpdate = async () => {
	if (!pendingAvatarFile.value) {
		ElMessage.warning('请先选择图片')
		return
	}

	try {
		avatarSaving.value = true
		const [avatarUrl] = await uploadImagesAndGetUrls([pendingAvatarFile.value])
		if (!avatarUrl) {
			ElMessage.error('头像上传失败，请重试')
			return
		}

		const response = await updateUserInfoApi({ avatar: avatarUrl })
		if (!hasCodeField(response?.data)) {
			ElMessage.error(response?.data?.msg || '修改头像失败')
			return
		}

		profile.avatar = avatarUrl
		userStore.setAvatar(avatarUrl)
		avatarDialogVisible.value = false
		ElMessage.success(response.data.msg || '头像修改成功')
	} catch {
		ElMessage.error('修改头像失败，请稍后重试')
	} finally {
		avatarSaving.value = false
	}
}

const handleStaticAction = async (actionName: string) => {
	try {
		if (actionName === '修改昵称') {
			openNicknameDialog()
			return
		}

		if (actionName === '修改头像') {
			openAvatarDialog()
			return
		}

		ElMessage.warning('暂不支持该操作')
	} catch {
		ElMessage.error('操作失败，请稍后重试')
	}
}
const handleFeedbackSubmit = async () => {
	const content = feedbackText.value.trim()
	if (!content || content.length < 6) {
		ElMessage.warning('请输入六个字以上的描述')
		return
	}

	if (feedbackSubmitting.value) return
	feedbackSubmitting.value = true

	try {
    const contact = (profile.phone || userStore.username || '未填写').trim()
    const response = await submitFeedbackApi({
			type: mapFeedbackTypeToApiType(feedbackType.value),
      content,
      contact
    })

    if (hasCodeField(response?.data)) {
      ElMessage.success(response.data.msg || '提交成功')
      feedbackText.value = ''
    } else {
      ElMessage.error(response?.data?.msg || '提交失败')
    }
	} catch {
		ElMessage.error('提交反馈失败，请稍后重试')
	} finally {
		feedbackSubmitting.value = false
	}
}


const statusClass = (status?: string) => {
	const statusLabel = normalizeStatus(status)
	if (statusLabel === '已通过') return 'status-approved'
	if (statusLabel === '已匹配') return 'status-matched'
	if (statusLabel === '已认领') return 'status-claimed'
	if (statusLabel === '已驳回') return 'status-rejected'
	return 'status-pending'
}

const openItemDetail = (item: ViewMyItem) => {
	activeItem.value = item
	editForm.title = item.title || ''
	editForm.campus = item.campus || ''
	editForm.category = item.category || ''
	editForm.location = item.location || ''
	editForm.time = toApiTimeString(item.time) || item.time || ''
	editForm.description = item.description || ''
	editForm.contact_name = item.contact_name || ''
	editForm.contact_phone = item.contact_phone || ''
	editForm.img1 = item.img1 || ''
	editForm.img2 = item.img2 || ''
	editForm.img3 = item.img3 || ''
	editForm.img4 = item.img4 || ''
	detailVisible.value = true
}

const handleResubmit = async () => {
	if (!activeItem.value) return
	if (!canEditCurrent.value) {
		ElMessage.warning('当前状态不可修改重新发送')
		return
	}
	if (!editForm.title.trim()) {
		ElMessage.warning('物品名称不能为空')
		return
	}

	const normalizedTime = toApiTimeString(editForm.time)
	if (normalizedTime === null) {
		ElMessage.warning('时间格式错误，需为 2006-01-02 15:04:05')
		return
	}

	resubmitLoading.value = true
	try {
		const response = await updateMyItemApi(activeItem.value.id, {
			title: editForm.title.trim(),
			campus: editForm.campus.trim() || undefined,
			category: editForm.category.trim() || undefined,
			location: editForm.location.trim() || undefined,
			time: normalizedTime,
			description: editForm.description.trim() || undefined,
			contact_name: editForm.contact_name.trim() || undefined,
			contact_phone: editForm.contact_phone.trim() || undefined,
			img1: editForm.img1 || undefined,
			img2: editForm.img2 || undefined,
			img3: editForm.img3 || undefined,
			img4: editForm.img4 || undefined
		})

		if (hasCodeField(response?.data)) {
			ElMessage.success(response.data.msg || '重新发送成功')
			detailVisible.value = false
			await fetchMyItems()
			return
		}
		ElMessage.error(response?.data?.msg || '重新发送失败')
	} catch {
		ElMessage.error('重新发送失败，请稍后重试')
	} finally {
		resubmitLoading.value = false
	}
}

const handleLogout = async () => {
	try {
		await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
			confirmButtonText: '确定退出',
			cancelButtonText: '取消',
			type: 'warning'
		})
		try {
			const response = await logoutApi()
			if (Number(response?.data?.code) !== 200) {
				ElMessage.warning(response?.data?.msg || '退出接口调用失败，已执行本地退出')
			}
		} catch {
			ElMessage.warning('退出接口调用失败，已执行本地退出')
		}
		userStore.clearUserData()
		router.push('/')
		ElMessage.success('退出登录成功')
	} catch {
		// 用户取消退出
	}
}

const loadProfile = async () => {
	if (!userStore.username) return
	const response = await getUserInfoApi({ username: userStore.username })
	if (hasCodeField(response?.data)) {
		profile.username = response.data.data?.username || ''
		profile.name = response.data.data?.name || ''
		profile.phone = response.data.data?.phone || ''
		profile.avatar = normalizeResourceUrl(response.data.data?.avatar)
		userStore.setAvatar(profile.avatar)
		userStore.setNickname(response.data.data?.nickname || '')
	}
}

const handleChangePassword = async () => {
	if (!passwordFormRef.value) return

	await passwordFormRef.value.validate(async (valid) => {
		if (!valid) return
		if (passwordForm.old_password === passwordForm.new_password) {
			ElMessage.warning('新密码不能与原密码相同')
			return
		}

		submitting.value = true
		try {
			const response = await changePasswordApi({
				old_password: passwordForm.old_password,
				new_password: passwordForm.new_password
			})

			if (response?.data?.code === 200) {
				// 修改成功后清空表单，并提示成功，不进行页面跳转
				passwordForm.old_password = ''
				passwordForm.new_password = ''
				passwordForm.confirm_password = ''
				if (passwordFormRef.value) {
					passwordFormRef.value.resetFields()
				}
				ElMessage.success(response.data.msg || '密码修改成功')
				// 如果是从强制修改密码过来的状态，更新一下状态（虽然此处是个人中心，一般不是强制状态）
				if (userStore.firstLogin) {
					userStore.setFirstLogin(false)
				}
				return
			}

			ElMessage.error(response?.data?.msg || '密码修改失败')
		} catch {
			ElMessage.error('密码修改失败，请稍后重试')
		} finally {
			submitting.value = false
		}
	})
}

onMounted(async () => {
	try {
		await loadProfile()
		await fetchMyItems()
	} catch {
		// noop
	}
})
</script>

<style scoped>
.feedback-type-wrapper {
	display: flex;
	align-items: center;
	margin-bottom: 24px;
	gap: 24px;
}
.fb-label {
	font-size: 14px;
	color: #606266;
	width: 80px;
	text-align: right;
  flex-shrink: 0;
}
.fb-type-options {
	display: flex;
	gap: 32px;
}
.fb-option {
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	font-size: 14px;
	color: #303133;
}
.radio-circle {
	width: 16px;
	height: 16px;
	border: 1px solid #dcdfe6;
	border-radius: 50%;
	position: relative;
	transition: all 0.3s;
}
.fb-option.active .radio-circle {
	border-color: #ff9900;
	background: #ff9900;
}
.fb-option.active .radio-circle::after {
	content: '';
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 6px;
	height: 6px;
	background: #fff;
	border-radius: 50%;
}
.feedback-input-wrapper {
	background: #fff8eb;
	border-radius: 8px;
	padding: 16px;
	position: relative;
}
.custom-textarea :deep(.el-textarea__inner) {
	background: transparent;
	border: none;
	resize: none;
	box-shadow: none !important;
	padding: 0;
	font-size: 14px;
	color: #606266;
}
.custom-textarea :deep(.el-input__count) {
	background: transparent;
	bottom: -4px;
	right: 0;
}
.submit-btn {
	width: 140px;
	height: 44px;
	font-size: 16px;
	border-radius: 8px;
}
.profile-page {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.profile-top-card,
.profile-main-card {
	border: none;
}

.profile-top {
	padding: 6px 0;
}

.avatar-file-input {
	display: none;
}

.avatar-dialog-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 8px 0 4px;
}

.avatar-block {
	display: flex;
	align-items: center;
	gap: 24px;
}

.avatar-circle {
	background: linear-gradient(180deg, #fcb045, #ff7a00);
	color: #fff;
}

.avatar-actions {
	display: flex;
	flex-direction: column;
  justify-content: center;
  align-items: center;
	gap: 10px;
}

.pill-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  padding: 0 14px;
}

.btn-icon {
	margin-left: 8px;
}

.toolbar-top {
	display: flex;
	justify-content: flex-end;
	padding-bottom: 10px;
	border-bottom: 1px solid #f0f0f0;
}

.toolbar-right {
	display: flex;
	align-items: center;
	gap: 16px;
	font-size: 13px;
}

.meta-link {
	color: #909399;
}

.meta-link.active {
	color: #303133;
	font-weight: 600;
}

.toolbar-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin: 16px 0;
}

.manage-btn {
	--el-color-warning: #f97316;
}

.status-tabs {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	margin-bottom: 16px;
}

.status-pill {
	border: 1px solid #ebeef5;
	background: #fff;
	height: 36px;
	padding: 0 20px;
	border-radius: 18px;
	cursor: pointer;
	font-size: 14px;
	color: #606266;
}

.status-pill.active {
	background: #f97316;
	color: #fff;
	border-color: #f97316;
}

.publish-list {
	min-height: 180px;
}

.card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 16px;
}

.item-card {
	border: 1px solid #f3c07b;
	border-radius: 8px;
	padding: 14px;
	background: #fff;
	cursor: pointer;
	overflow: hidden;
}

.card-head .row {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	column-gap: 8px;
	line-height: 1.8;
	font-size: 14px;
}

.card-head .row span:last-child {
	min-width: 0;
	word-break: break-all;
	overflow-wrap: anywhere;
}

.label {
	color: #606266;
}

.card-body {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 120px;
	margin-top: 10px;
	gap: 10px;
	align-items: start;
}

.tags-col {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
}

.tags-col :deep(.el-tag) {
	max-width: 100%;
}

.tags-col :deep(.el-tag__content) {
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.img-col {
	width: 120px;
	flex: 0 0 120px;
}

.item-image {
	width: 120px;
	height: 90px;
	border-radius: 6px;
	overflow: hidden;
}

.empty-img {
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f7fa;
	color: #909399;
	font-size: 12px;
}

.card-foot {
	display: flex;
	justify-content: space-between;
	margin-top: 10px;
	font-size: 13px;
}

.created {
	color: #909399;
}

.status {
	font-weight: 600;
}

.status-pending {
	color: #e6a23c;
}

.status-approved {
	color: #409eff;
}

.status-matched {
	color: #f56c6c;
}

.status-claimed {
	color: #67c23a;
}

.status-rejected {
	color: #909399;
}

.pager {
	display: flex;
	justify-content: center;
	margin-top: 16px;
}

.section-block {
	margin-top: 28px;
	padding-top: 16px;
	border-top: 1px solid #f0f0f0;
}

.section-title {
	font-size: 17px;
	font-weight: 600;
	margin-bottom: 14px;
}

.feedback-actions {
	margin-top: 12px;
	display: flex;
	justify-content: flex-end;
}

.dialog-images {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin: 4px 0 8px;
}

.dialog-img {
	width: 120px;
	height: 90px;
	border-radius: 6px;
	overflow: hidden;
	border: 1px solid #ebeef5;
}

.dialog-empty-img {
	font-size: 13px;
	color: #909399;
}

.dialog-footer-actions {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 10px;
}

.manage-title {
	font-size: 20px;
	font-weight: 600;
	padding-left: 12px;
}

.manage-table {
	margin: 0 6px;
}

.table-images {
	display: flex;
	gap: 8px;
}

.table-img {
	width: 88px;
	height: 56px;
	border-radius: 4px;
	overflow: hidden;
}

.table-actions {
	display: flex;
	gap: 8px;
	flex-wrap: nowrap;
}

.table-confirm-btn {
	padding: 0;
}

.table-actions .table-confirm-btn :deep(.confirm-button) {
	height: 24px;
	padding: 0 12px;
	border-radius: 12px;
	font-size: 12px;
}

.table-actions .detail-btn {
	--el-button-bg-color: #f97316;
	--el-button-border-color: #f97316;
	--el-button-text-color: #fff;
	--el-button-hover-bg-color: #ea6a0f;
	--el-button-hover-border-color: #ea6a0f;
	--el-button-active-bg-color: #ea6a0f;
	--el-button-active-border-color: #ea6a0f;
	--el-button-disabled-bg-color: #dcdfe6;
	--el-button-disabled-border-color: #dcdfe6;
	--el-button-disabled-text-color: #fff;
	min-width: 52px !important;
	height: 32px!important;
	padding: 0 12px!important;
	font-size: 12px!important;
  border-radius: 15%;
}

.reason-link {
	color: #f56c6c;
	cursor: pointer;
}

.dialog-pager {
	display: flex;
	justify-content: center;
	margin-top: 18px;
}

.claim-detail-wrap {
	min-height: 180px;
}

.claim-detail-block {
	margin-top: 12px;
	padding: 10px 12px;
	background: #fafafa;
	border-radius: 8px;
	border: 1px solid #f0f0f0;
}

.claim-detail-title {
	font-size: 14px;
	font-weight: 600;
	color: #303133;
	margin-bottom: 6px;
}

.claim-detail-text {
	font-size: 13px;
	line-height: 1.7;
	color: #606266;
	white-space: pre-wrap;
	word-break: break-word;
}
</style>

import request from '@/utils/request'

/** 通用接口响应结构 */
export interface ApiResponse<T = unknown> {
  code: number      // 状态码
  msg: string       // 提示信息
  data: T           // 数据主体
}

/** 分页响应结构 */
export interface PageResponse<T> {
  list: T[]         // 当前页数据列表
  total: number     // 总条数
}

/** 分页参数（后端要求的字段名） */
export interface PageParams {
  page_num: number
  page_size: number
}

/** 分页参数（前端通用字段名） */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/** 用户信息结构 */
export interface User {
  ID: number
  username: string
  name: string
  nickname: string
  phone: string
  role: number
  is_active: boolean
  avatar: string
  CreatedAt: string
}

/** 公告信息结构 */
export interface Announcement {
  ID: number
  title: string
  content: string
  type: string
  publisher: string
  is_top: boolean
  status: string
  region?: string
  CreatedAt: string
}

/** 反馈信息结构 */
export interface Feedback {
  ID: number
  type: string
  content: string
  contact: string
  status: string
  reply?: string
  CreatedAt: string
}

/** 物品类别结构 */
export interface Category {
  id: number
  kind_name: string
}

/** 获取用户列表参数 */
export interface GetUsersParams extends PageParams {
  role?: number      // 用户角色筛选
  keyword?: string   // 关键字搜索
}

/** 创建管理员请求参数 */
export interface CreateAdminRequest {
  username: string
  password: string
  name: string
}

/** 更新用户状态请求参数 */
export interface UpdateUserStatusRequest {
  is_active: boolean
}

/** 创建系统公告请求参数 */
export interface CreateSystemAnnouncementRequest {
  title: string
  content: string
  type: string
  is_top?: boolean
}

/** 公告审核请求参数 */
export interface ReviewAnnouncementRequest {
  id: number
  status: 'published' | 'rejected' | 'approved'
}

/** 获取反馈列表参数 */
export interface GetFeedbacksParams extends PageParams {
  status?: string    // 反馈状态筛选
}

/** 回复反馈请求参数 */
export interface ReplyFeedbackRequest {
  reply: string
}

/** 数据清理请求参数 */
export interface CleanupRequest {
  days: number       // 清理多少天前的数据
}

/** 新增物品类别请求参数 */
export interface AddCategoryRequest {
  name: string
}

/** 发送消息请求参数 */
export interface SendMessageRequest {
  receiver_id: number
  content: string
  type?: number
  item_id?: number
}

/** 超管统计数据结构 */
export interface SuperStats {
  total_users?: number
  active_users?: number
  total_items?: number
  solved_items?: number
  total_claims?: number
  today_items?: number
  [key: string]: unknown
}

/** 更新用户信息请求参数 */
export interface UpdateUserRequest {
  username?: string
  name?: string
  nickname?: string
  phone?: string
  role?: number
  is_active?: boolean
  avatar?: string
}

/** 用户列表参数兼容类型（支持前端和后端字段） */
type UserListCompatParams = PaginationParams & {
  page_num?: number
  page_size?: number
  role?: number
  keyword?: string
}

/** 公告列表参数兼容类型 */
type AnnouncementCompatParams = PaginationParams & {
  page_num?: number
  page_size?: number
  status?: string
  type?: string
  region?: string
}

/** 反馈列表参数兼容类型 */
type FeedbackCompatParams = PaginationParams & {
  page_num?: number
  page_size?: number
  status?: string
}

/** 获取系统统计数据 */
export const getSuperStatsApi = () =>
  request<ApiResponse<SuperStats>>({
    url: '/api/v1/super/stats',
    method: 'GET',
  })

/** 清理过期数据 */
export const cleanupDataApi = (data: CleanupRequest) =>
  request<ApiResponse<null>>({
    url: '/api/v1/super/data/cleanup',
    method: 'POST',
    data,
  })

/** 获取用户列表 */
export const getUsersApi = (params: GetUsersParams) =>
  request<ApiResponse<PageResponse<User>>>({
    url: '/api/v1/super/users',
    method: 'GET',
    params,
  })

/** 创建管理员账号 */
export const createAdminApi = (data: CreateAdminRequest) =>
  request<ApiResponse<null>>({
    url: '/api/v1/super/users/admin',
    method: 'POST',
    data,
  })

/** 更新用户激活状态 */
export const updateUserStatusApi = (id: number, data: UpdateUserStatusRequest) =>
  request<ApiResponse<null>>({
    url: `/api/v1/super/users/${id}/status`,
    method: 'PUT',
    data,
  })

/** 获取公告列表 */
export const getAnnouncementsApi = (params: PageParams) =>
  request<ApiResponse<PageResponse<Announcement>>>({
    url: '/api/v1/super/announcements',
    method: 'GET',
    params,
  })

/** 创建系统公告 */
export const createSystemAnnouncementApi = (data: CreateSystemAnnouncementRequest) =>
  request<ApiResponse<null>>({
    url: '/api/v1/super/announcements',
    method: 'POST',
    data,
  })

/** 审核公告 */
export const reviewAnnouncementApi = (data: ReviewAnnouncementRequest) =>
  request<ApiResponse<null>>({
    url: '/api/v1/super/announcements/review',
    method: 'PUT',
    data,
  })

/** 删除公告 */
export const deleteAnnouncementApi = (id: number) =>
  request<ApiResponse<null>>({
    url: `/api/v1/super/announcements/${id}`,
    method: 'DELETE',
  })

/** 获取反馈列表 */
export const getFeedbacksApi = (params: GetFeedbacksParams) =>
  request<ApiResponse<PageResponse<Feedback>>>({
    url: '/api/v1/super/feedbacks',
    method: 'GET',
    params,
  })

/** 回复反馈 */
export const replyFeedbackApi = (id: number, data: ReplyFeedbackRequest) =>
  request<ApiResponse<null>>({
    url: `/api/v1/super/feedbacks/${id}/reply`,
    method: 'PUT',
    data,
  })

/** 获取物品类别列表 */
export const getCategoriesApi = () =>
  request<ApiResponse<Category[]>>({
    url: '/api/v1/kinds',
    method: 'GET',
  })

/** 新增物品类别 */
export const addCategoryApi = (data: AddCategoryRequest) =>
  request<ApiResponse<null>>({
    url: '/api/v1/super/categories',
    method: 'POST',
    data,
  })

/** 删除物品类别 */
export const deleteCategoryApi = (id: number) =>
  request<ApiResponse<null>>({
    url: `/api/v1/super/categories/${id}`,
    method: 'DELETE',
  })

/** 发送站内消息 */
export const sendMessageApi = (data: SendMessageRequest) =>
  request<ApiResponse<null>>({
    url: '/api/v1/messages',
    method: 'POST',
    data,
  })

/** 更新用户信息 */
export const updateUserApi = (id: number, data: UpdateUserRequest) =>
  request<ApiResponse<null>>({
    url: `/api/v1/super/users/${id}`,
    method: 'PUT',
    data,
  })

/** 删除用户 */
export const deleteUserApi = (id: number) =>
  request<ApiResponse<null>>({
    url: `/api/v1/super/users/${id}`,
    method: 'DELETE',
  })

/** 获取用户列表（兼容参数） */
export const getUserList = (params?: UserListCompatParams) => {
  const newParams = {
    ...params,
    page_num: params?.page || params?.page_num || 1,
    page_size: params?.pageSize || params?.page_size || 10,
  }
  return getUsersApi(newParams as GetUsersParams)
}

/** 获取系统统计数据（别名） */
export const getSuperStats = getSuperStatsApi
/** 清理过期数据（别名） */
export const cleanupExpiredData = cleanupDataApi

/** 获取公告列表（兼容参数） */
export const getAnnouncements = (params?: AnnouncementCompatParams) => {
  const newParams = {
    ...params,
    page_num: params?.page || params?.page_num || 1,
    page_size: params?.pageSize || params?.page_size || 10,
  }
  return getAnnouncementsApi(newParams as PageParams)
}

/** 创建系统公告（别名） */
export const createSystemAnnouncement = createSystemAnnouncementApi
/** 审核公告（别名） */
export const reviewAnnouncement = reviewAnnouncementApi
/** 删除公告（别名） */
export const deleteAnnouncement = deleteAnnouncementApi
/** 获取物品类别列表（别名） */
export const getCategoryList = getCategoriesApi
/** 新增物品类别（别名） */
export const addCategory = addCategoryApi
/** 删除物品类别（别名） */
export const deleteCategory = deleteCategoryApi
/** 更新用户激活状态（别名） */
export const updateUserStatus = updateUserStatusApi
/** 创建管理员账号（别名） */
export const createAdmin = createAdminApi
/** 发送站内消息（别名） */
export const sendMessage = sendMessageApi
/** 更新用户信息（别名） */
export const updateUser = updateUserApi
/** 删除用户（别名） */
export const deleteUser = deleteUserApi

/** 获取反馈列表（兼容参数） */
export const getFeedbacks = (params?: FeedbackCompatParams) => {
  const newParams = {
    ...params,
    page_num: params?.page || params?.page_num || 1,
    page_size: params?.pageSize || params?.page_size || 10,
  }
  return getFeedbacksApi(newParams as GetFeedbacksParams)
}

/** 回复反馈（别名） */
export const replyFeedback = replyFeedbackApi

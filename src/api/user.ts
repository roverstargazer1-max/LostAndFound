import request from '@/utils/request'


// 登录参数类型
export interface LoginParams {
  role: number // 角色类型,1:学生/老师, 2:失物招领管理员, 3:系统管理员
  username: string
  password: string
}

// 获取用户信息参数类型
export interface GetUserInfoParams {
  username: string
}

// 修改用户信息参数类型
export interface UpdateUserInfoParams {
  name?: string
  nickname?: string
  phone?: string
  avatar?: string
}

export interface ChangePasswordParams {
  old_password: string
  new_password: string
}

export type FeedbackType = 'suggestion' | 'complaint'

export interface SubmitFeedbackParams {
  type: FeedbackType
  content: string
  contact: string
}

export interface SubmitFeedbackResponse {
  code: number
  msg: string
  data: null
}

export type MyItemStatus = '' | 'pending' | 'approved' | 'matched' | 'claimed' | 'archived' | 'rejected'|'cancelled'

export interface MyItemsParams {
  status?: MyItemStatus
  page_num?: number
  page_size?: number
}

export interface MyItemPublisher {
  ID?: number
  Username?: string
  name?: string
  nickname?: string
  phone?: string
}

export interface MyItem {
  ID?: number
  id?: number
  title?: string
  type?: string
  campus?: string
  category?: string
  location?: string
  time?: string
  description?: string
  img1?: string
  img2?: string
  img3?: string
  img4?: string
  contact_name?: string
  contact_phone?: string
  is_bounty?: boolean
  status?: string
  publisher_id?: number
  publisher?: MyItemPublisher
  CreatedAt?: string
  UpdatedAt?: string
  DeletedAt?: string | null
  reject_reason?: string | null
  process_method?: string | null
}

export interface GetMyItemsResponse {
  code: number
  msg: string
  data: {
    list: MyItem[]
    total: number
  }
}

export interface MyClaimsParams {
  page_num?: number
  page_size?: number
}

export interface MyClaimUser {
  ID?: number
  username?: string
  role?: number
  name?: string
  nickname?: string
  phone?: string
  is_active?: boolean
  first_login?: boolean
}

export interface MyClaimItem {
  ID?: number
  CreatedAt?: string
  UpdatedAt?: string
  DeletedAt?: string | null
  item_id?: number
  item?: MyItem & {
    reviewer_id?: number | null
    reject_reason?: string
    process_method?: string
  }
  claimant_id?: number
  claimant?: MyClaimUser
  reject_reason?: string | null
  peer_user_id?: number | null
  status?: string
  proof?: string
}

export interface GetMyClaimsResponse {
  code: number
  msg: string
  data: {
    list: MyClaimItem[]
    total: number
  }
}

export interface GetMyClaimDetailResponse {
  code: number
  msg: string
  data: MyClaimItem
}

export interface LogoutResponse {
  code: number
  msg: string
  data: null
}
// 登录接口
export const loginApi = (params: LoginParams) => {
  return request ({
    "headers":{
      "Content-Type": "application/json",
    } ,
    url: '/api/v1/login',
    method: 'post',
    data: params
  })
}
// 获取用户信息接口
export const getUserInfoApi = (params: GetUserInfoParams) => {
  return request ({
    "headers":{
      "Content-Type": "application/json",
    } ,
    url: '/api/v1/profile',
    method: 'get',
    params
  })
}
// 修改密码接口
export const changePasswordApi = (data: ChangePasswordParams) => {
  return request ({
    "headers":{
      "Content-Type": "application/json",
    } ,
    url: '/api/v1/password',
    method: 'put',
    data
  })
}
// 修改用户信息接口
export const updateUserInfoApi = (data: Partial<UpdateUserInfoParams>) => {
  return request ({
    "headers":{
      "Content-Type": "application/json",
    } ,
    url: '/api/v1/profile',
    method: 'put',
    data
  })
}
// 获取我的发布列表接口
export const getMyItemsApi = (params: MyItemsParams) => {
  return request<GetMyItemsResponse>({
    headers: {
      'Content-Type': 'application/json'
    },
    url: '/api/v1/my/items',
    method: 'get',
    params
  })
}
// 获取我的认领列表接口
export const getMyClaimsApi = (params: MyClaimsParams) => {
  return request<GetMyClaimsResponse>({
    headers: {
      'Content-Type': 'application/json'
    },
    url: '/api/v1/my/claims',
    method: 'get',
    params
  })
}
// 获取我的认领详情接口
export const getMyClaimDetailApi = (id: number) => {
  return request<GetMyClaimDetailResponse>({
    headers: {
      'Content-Type': 'application/json'
    },
    url: `/api/v1/claims/${id}`,
    method: 'get'
  })
}
// 退出登录接口
export const logoutApi = () => {
  return request<LogoutResponse>({
    headers: {
      'Content-Type': 'application/json'
    },
    url: '/api/v1/logout',
    method: 'post'
  })
}
//提交反馈接口
export const submitFeedbackApi = (data: SubmitFeedbackParams) => {
  return request<SubmitFeedbackResponse>({
    headers: {
      'Content-Type': 'application/json'
    },
    url: '/api/v1/feedbacks',
    method: 'post',
    data
  })
}

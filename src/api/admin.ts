import request from '@/utils/request'

// 管理员端接口注释：统一封装 admin 侧的审核、公告和统计相关请求。

// ==================== 类型定义 ====================

/** 驳回审核请求  */
export interface RejectRecordRequest {
  reject_reason: string
}

/** 归档记录请求  */
export interface ArchiveRecordRequest {
  process_method: string
}

/** 分页参数 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/** 公告列表查询参数（支持分页、状态、类型、区域筛选） */
export interface AnnouncementQueryParams extends PaginationParams {
  status?: string
  type?: string
  region?: string
}

/** 物品列表查询参数 */
export interface ItemListParams extends PaginationParams {
  status?: string
  type?: string
  keyword?: string
  time_range?: string
  lost_or_found?: string | number
  campus?: string
  category?: string
}

/** 管理员更新物品请求 - 与 UpdateRecordRequest 字段一致 */
export interface AdminUpdateItemRequest {
  title?: string
  category?: string
  campus?: string
  location?: string
  time?: string
  description?: string
  contact_name?: string
  contact_phone?: string
  img1?: string
  img2?: string
  img3?: string
  img4?: string
  status?: string
  process_method?: string
}

// ==================== 物品管理 ====================

/** 管理员获取物品列表 */
export function getAllItems(params?: ItemListParams) {
  return request.get('/api/v1/admin/items', {
    params: {
      page_num: params?.page || 1,
      page_size: params?.pageSize || 10,
      status: params?.status,
      lost_or_found: params?.lost_or_found,
      campus: params?.campus,
      category: params?.category,
      keyword: params?.keyword,
      time_range: params?.time_range,
    }
  })
}

/** 管理员获取待审核物品 */
export function getPendingItems(params?: PaginationParams) {
  return request.get('/api/v1/admin/items/pending', {
    params: { page_num: params?.page || 1, page_size: params?.pageSize || 10 }
  })
}

/** 通过审核 */
export function approveItem(id: number) {
  return request.put(`/api/v1/admin/items/${id}/approve`)
}

/** 驳回审核 */
export function rejectItem(id: number, data: RejectRecordRequest) {
  return request.put(`/api/v1/admin/items/${id}/reject`, data)
}

/** 归档物品 */
export function archiveItem(id: number, data: ArchiveRecordRequest) {
  return request.put(`/api/v1/admin/items/${id}/archive`, data)
}

/** 管理员更新物品 */
export function updateItem(id: number, data: AdminUpdateItemRequest) {
  return request.put(`/api/v1/admin/items/${id}`, data)
}

// ==================== 认领管理 ====================

/** 管理员获取待审核认领 */
export function getPendingClaims(params?: PaginationParams) {
  return request.get('/api/v1/admin/claims/pending', {
    params: { page_num: params?.page || 1, page_size: params?.pageSize || 10 }
  })
}

/** 通过认领 */
export function approveClaim(id: number) {
  return request.put(`/api/v1/admin/claims/${id}/approve`)
}

/** 驳回认领（部分后端支持回传原因） */
export function rejectClaim(id: number, data?: RejectRecordRequest) {
  return request.put(`/api/v1/admin/claims/${id}/reject`, data)
}

// ==================== 公告管理 ====================

/** 获取公告列表（SuperAdmin 接口，Admin 也调用） */
export async function getAnnouncements(params?: AnnouncementQueryParams) {
  const query = {
    page_num: params?.page || 1,
    page_size: params?.pageSize || 50,
    status: params?.status,
    type: params?.type,
    region: params?.region,
  }
  try {
    return await request.get('/api/v1/super/announcements', { params: query, silentError: true } as any)
  } catch (error: unknown) {
    const status = Number(((error as { response?: { status?: number } })?.response?.status) || 0)
    if (status === 403 || status === 404) {
      return request.get('/api/v1/announcements', {
        params: {
          page_num: query.page_num,
          page_size: query.page_size,
        },
        silentError: true,
      } as any)
    }
    throw error
  }
}

/** 管理员发布区域公告 */
export async function createAnnouncement(data: { title: string; content: string; type?: string; region: string; is_top?: boolean }) {
  try {
    return await request.post('/api/v1/admin/announcements', data)
  } catch (err: unknown) {
    const httpError = err as { response?: { status?: number } } | undefined
    if (Number(httpError?.response?.status || 0) === 404) {
      return request.post('/api/v1/admin/announcement', data)
    }
    throw err
  }
}

// ==================== 数据统计 ====================

/** 获取系统统计数据 */
export function getDashboardStats() {
  return request.get('/api/v1/admin/stats')
}

/** 导出统计数据 (CSV) */
export function exportStatsCSV() {
  return request.get('/api/v1/admin/export', {
    responseType: 'blob'  // CSV 文件需要 blob 类型
  })
}


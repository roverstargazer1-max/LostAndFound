import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useUserStore } from './user'

export interface AuditRecord {
  id: number
  item: any
  action: 'approved' | 'rejected'
  /** 审核类型：item=帖子审核, claim=认领审核 */
  type: 'item' | 'claim'
  reason?: string
  operator: string
  time: string
}

export const useAuditHistoryStore = defineStore('auditHistory', () => {
  const records = ref<AuditRecord[]>([])
  const userStore = useUserStore()

  /** 根据当前用户生成 localStorage key */
  function getStorageKey(): string {
    const role = Number(userStore.role) || 0
    const userKey = userStore.username || 'default'
    return `audit_history_${role}_${userKey}`
  }

  /** 从 localStorage 加载当前用户的记录 */
  function loadRecords() {
    try {
      const raw = localStorage.getItem(getStorageKey())
      records.value = raw ? JSON.parse(raw) : []
      if (userStore.username) {
        records.value = records.value.map((record) => {
          // 如果操作人是昵称或没填，则补成用户名
          if (record.operator === userStore.nickname || !record.operator) {
            return { ...record, operator: userStore.username }
          }
          return record
        })
      }
    } catch {
      records.value = []
    }
  }

  /** 保存到 localStorage */
  function saveRecords() {
    localStorage.setItem(getStorageKey(), JSON.stringify(records.value))
  }

  /**
   * 新增一条审核记录
   * @param item 物品/认领的原始数据
   * @param action 通过 or 驳回
   * @param reason 驳回原因（可选）
   * @param type 审核类型：'item' 帖子审核 / 'claim' 认领审核
   */
  function addRecord(
    item: any,
    action: 'approved' | 'rejected',
    reason?: string,
    type: 'item' | 'claim' = 'item'
  ) {
    const record: AuditRecord = {
      id: Date.now(),
      item: JSON.parse(JSON.stringify(item)), // 深拷贝，防止被外部修改
      action,
      type,
      reason,
      operator: userStore.username || userStore.nickname || '管理员',
      time: new Date().toLocaleString('zh-CN'),
    }
    records.value.unshift(record) // 最新的放最前面
    // 最多保留200条
    if (records.value.length > 200) {
      records.value = records.value.slice(0, 200)
    }
    saveRecords()
  }

  // 初始化加载
  loadRecords()

  // 监听用户变化，重新加载对应用户的记录
  watch(() => `${userStore.role}_${userStore.username}`, () => {
    loadRecords()
  })

  return { records, addRecord, loadRecords }
})

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChildId, PointRecord, ExchangeRecord, AppState, Child, Task, Reward } from '../types'
import {
  supabase,
  isConfigured,
  fetchChildren,
  fetchRecords,
  fetchExchanges,
  addRecord as cloudAddRecord,
  addExchangeRecord as cloudAddExchange,
  deleteRecordById,
  subscribeRecords,
  subscribeExchanges
} from '../lib/supabase'

// ============================================================
// 本地存储
// ============================================================
const STORAGE_KEY = 'point-system-data'
const CLOUD_MIGRATED_KEY = 'point-system-migrated-to-cloud'

const defaultState: AppState = {
  currentChild: '00000000-0000-0000-0000-000000000001',
  records: [],
  exchanges: [],
  customTasks: [],
  customRewards: []
}

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 兼容旧数据，补充缺失字段
      return {
        ...defaultState,
        ...parsed,
        customTasks: parsed.customTasks ?? [],
        customRewards: parsed.customRewards ?? []
      }
    }
  } catch {}
  return defaultState
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// ============================================================
// Supabase 返回的数据适配（cloud → local 格式）
// ============================================================
function adaptRecord(r: any): PointRecord {
  return {
    id: r.id,
    childId: r.child_id,
    taskId: r.task_id,
    taskName: r.task_name,
    taskCategory: r.task_category,
    points: r.points,
    date: r.date,
    time: r.created_at ? new Date(r.created_at).toTimeString().slice(0, 5) : '',
    type: r.points > 0 ? 'earn' : 'redeem'
  }
}

function adaptExchange(e: any): ExchangeRecord {
  return {
    id: e.id,
    childId: e.child_id,
    rewardId: '',
    rewardName: e.reward_name,
    points: e.reward_points,
    date: e.date,
    time: e.created_at ? new Date(e.created_at).toTimeString().slice(0, 5) : ''
  }
}

// ============================================================
// Hook
// ============================================================
export function useStore() {
  const [state, setState] = useState<AppState>(loadState)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(false)
  const [cloudMode, setCloudMode] = useState(false)
  const loadedRef = useRef(false)

  // state 每次变化自动持久化到 localStorage（云端模式不覆盖）
  useEffect(() => {
    if (!cloudMode) {
      saveState(state)
    }
  }, [state, cloudMode])

  // ============================================================
  // 初始化：判断用本地还是云端
  // ============================================================
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    init()
  }, [])

  async function init() {
    if (isConfigured) {
      await loadFromCloud()
    }
  }

  async function loadFromCloud() {
    setLoading(true)
    try {
      // 标记已迁移（从今天开始全新数据）
      localStorage.setItem(CLOUD_MIGRATED_KEY, 'true')
      localStorage.removeItem(STORAGE_KEY)

      // 加载孩子列表
      const childList = await fetchChildren()
      setChildren(childList)

      // 加载所有孩子的记录（从今天开始，无历史数据）
      const allRecords: PointRecord[] = []
      const allExchanges: ExchangeRecord[] = []
      for (const child of childList) {
        const recs = await fetchRecords(child.id)
        allRecords.push(...recs.map(adaptRecord))
        const exs = await fetchExchanges(child.id)
        allExchanges.push(...exs.map(adaptExchange))
      }

      const cloudState: AppState = {
        currentChild: childList[0]?.id || '00000000-0000-0000-0000-000000000001',
        records: allRecords,
        exchanges: allExchanges,
        customTasks: [],
        customRewards: []
      }
      setState(cloudState)
      setCloudMode(true)
    } catch (err) {
      console.error('云端加载失败，回退到本地模式:', err)
      setCloudMode(false)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // 实时同步订阅（切换孩子时重新订阅）
  // ============================================================
  const recordSubRef = useRef<ReturnType<typeof subscribeRecords>>(null)
  const exchangeSubRef = useRef<ReturnType<typeof subscribeExchanges>>(null)

  useEffect(() => {
    if (!cloudMode || !isConfigured) return

    const childId = state.currentChild

    // 取消旧订阅
    recordSubRef.current?.unsubscribe()
    exchangeSubRef.current?.unsubscribe()

    // 重新订阅
    recordSubRef.current = subscribeRecords(childId, async () => {
      const recs = await fetchRecords(childId)
      setState(prev => ({
        ...prev,
        records: recs.map(adaptRecord)
      }))
    })

    exchangeSubRef.current = subscribeExchanges(childId, async () => {
      const exs = await fetchExchanges(childId)
      setState(prev => ({
        ...prev,
        exchanges: exs.map(adaptExchange)
      }))
    })

    return () => {
      recordSubRef.current?.unsubscribe()
      exchangeSubRef.current?.unsubscribe()
    }
  }, [cloudMode, state.currentChild])

  // ============================================================
  // 数据变更方法
  // ============================================================

  const setCurrentChild = useCallback((childId: ChildId) => {
    setState(prev => ({ ...prev, currentChild: childId }))
  }, [])

  const addRecord = useCallback(async (record: Omit<PointRecord, 'id' | 'time'> & { date?: string }) => {
    const now = new Date()
    const date = record.date || now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5)

    const newRecord: PointRecord = {
      ...record,
      date,
      time,
      type: record.points > 0 ? 'earn' : 'redeem'
    }

    if (cloudMode) {
      await cloudAddRecord({
        child_id: newRecord.childId,
        task_id: newRecord.taskId,
        task_name: newRecord.taskName,
        task_category: (newRecord as any).taskCategory || '',
        points: newRecord.points,
        date: newRecord.date
      })
    } else {
      newRecord.id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setState(prev => ({ ...prev, records: [newRecord, ...prev.records] }))
    }
    return newRecord
  }, [cloudMode])

  const addExchange = useCallback(async (exchange: Omit<ExchangeRecord, 'id' | 'date' | 'time'>) => {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5)

    const newExchange: ExchangeRecord = {
      ...exchange,
      date,
      time
    }

    if (cloudMode) {
      await cloudAddExchange({
        child_id: newExchange.childId,
        reward_name: newExchange.rewardName,
        reward_points: newExchange.points,
        date: newExchange.date
      })
    } else {
      newExchange.id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setState(prev => ({ ...prev, exchanges: [newExchange, ...prev.exchanges] }))
    }
    return newExchange
  }, [cloudMode])

  const deleteRecord = useCallback(async (recordId: string) => {
    if (cloudMode) {
      await deleteRecordById(recordId)
    }
    setState(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== recordId)
    }))
  }, [cloudMode])

  const getChildPoints = useCallback((childId: ChildId) => {
    const totalEarned = state.records
      .filter(r => r.childId === childId && r.type === 'earn')
      .reduce((sum, r) => sum + r.points, 0)
    const totalSpent = state.exchanges
      .filter(e => e.childId === childId)
      .reduce((sum, e) => sum + e.points, 0)
    return totalEarned - totalSpent
  }, [state.records, state.exchanges])

  const getTodayPoints = useCallback((childId: ChildId) => {
    const today = new Date().toISOString().split('T')[0]
    return state.records
      .filter(r => r.childId === childId && r.date === today && r.type === 'earn')
      .reduce((sum, r) => sum + r.points, 0)
  }, [state.records])

  const getWeekPoints = useCallback((childId: ChildId) => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - daysToMonday)
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    return state.records
      .filter(r => r.childId === childId && r.date >= weekStartStr && r.type === 'earn')
      .reduce((sum, r) => sum + r.points, 0)
  }, [state.records])

  const getRecordsByChild = useCallback((childId: ChildId) => {
    return state.records.filter(r => r.childId === childId)
  }, [state.records])

  const getExchangesByChild = useCallback((childId: ChildId) => {
    return state.exchanges.filter(e => e.childId === childId)
  }, [state.exchanges])

  const undoLastRecord = useCallback((childId: ChildId) => {
    const childRecords = state.records.filter(r => r.childId === childId)
    if (childRecords.length === 0) return false
    const lastRecord = childRecords[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (lastRecord.date < yesterday.toISOString().split('T')[0]) return false
    deleteRecord(lastRecord.id)
    return true
  }, [state.records, deleteRecord])

  const importState = useCallback((newState: AppState) => {
    setState(newState)
  }, [])

  const addCustomTask = useCallback((task: Omit<Task, 'id' | 'isCustom'>) => {
    const newTask: Task = {
      ...task,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      isCustom: true
    }
    setState(prev => ({ ...prev, customTasks: [...prev.customTasks, newTask] }))
    return newTask
  }, [])

  const updateCustomTask = useCallback((taskId: string, updates: Partial<Omit<Task, 'id' | 'isCustom'>>) => {
    setState(prev => ({
      ...prev,
      customTasks: prev.customTasks.map(t =>
        t.id === taskId ? { ...t, ...updates, isPositive: (updates.points ?? t.points) > 0 } : t
      )
    }))
  }, [])

  const deleteCustomTask = useCallback((taskId: string) => {
    setState(prev => ({ ...prev, customTasks: prev.customTasks.filter(t => t.id !== taskId) }))
  }, [])

  const addCustomReward = useCallback((reward: Omit<Reward, 'id' | 'isCustom'>) => {
    const newReward: Reward = {
      ...reward,
      id: `custom-reward-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      isCustom: true
    }
    setState(prev => ({ ...prev, customRewards: [...(prev.customRewards ?? []), newReward] }))
    return newReward
  }, [])

  const updateCustomReward = useCallback((rewardId: string, updates: Partial<Omit<Reward, 'id' | 'isCustom'>>) => {
    setState(prev => ({
      ...prev,
      customRewards: (prev.customRewards ?? []).map(r =>
        r.id === rewardId ? { ...r, ...updates } : r
      )
    }))
  }, [])

  const deleteCustomReward = useCallback((rewardId: string) => {
    setState(prev => ({
      ...prev,
      customRewards: (prev.customRewards ?? []).filter(r => r.id !== rewardId)
    }))
  }, [])

  return {
    state,
    children,
    loading,
    cloudMode,
    setCurrentChild,
    addRecord,
    addExchange,
    getChildPoints,
    getTodayPoints,
    getWeekPoints,
    getRecordsByChild,
    getExchangesByChild,
    undoLastRecord,
    deleteRecord,
    importState,
    addCustomTask,
    updateCustomTask,
    deleteCustomTask,
    addCustomReward,
    updateCustomReward,
    deleteCustomReward
  }
}

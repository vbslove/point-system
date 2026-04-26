import { useState, useEffect, useCallback, useRef } from 'react'
import { ChildId, PointRecord, ExchangeRecord, AppState, Child, Task, Reward } from '../types'
import {
  isConfigured,
  checkCloudAvailable,
  fetchChildren,
  fetchRecords,
  fetchExchanges,
  addRecord as cloudAddRecord,
  addExchangeRecord as cloudAddExchange,
  deleteRecordById,
  subscribeRecords,
  subscribeExchanges,
  saveCache,
  loadCache
} from '../lib/supabase'

// ============================================================
// 本地存储
// ============================================================
const STORAGE_KEY = 'point-system-data'

// 本地默认孩子数据
const localChildren: Child[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: '馒头', avatar: 'mantou' },
  { id: '00000000-0000-0000-0000-000000000002', name: '饺子', avatar: 'jiaozi' }
]

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
// Supabase 返回的数据适配
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
    rewardId: e.reward_id || '',
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
  const [children, setChildren] = useState<Child[]>(localChildren)
  const [loading, setLoading] = useState(true)
  const [cloudMode, setCloudMode] = useState(false)
  const loadedRef = useRef(false)

  // state 每次变化自动持久化到 localStorage
  useEffect(() => {
    if (!cloudMode) {
      saveState(state)
    }
  }, [state, cloudMode])

  // 初始化
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    init()
  }, [])

  async function init() {
    setLoading(true)
    try {
      // 先尝试检测云端
      const cloudAvailable = await checkCloudAvailable()
      
      if (cloudAvailable && isConfigured) {
        console.log('云端可用，加载云端数据...')
        try {
          await loadFromCloud()
        } catch (err) {
          console.error('云端加载失败:', err)
          // 尝试读取缓存
          const cache = loadCache()
          if (cache && cache.records.length > 0) {
            console.log('使用缓存数据')
            applyCacheData(cache)
          } else {
            console.log('无缓存，使用本地模式')
            setChildren(localChildren)
            setCloudMode(false)
          }
        }
      } else {
        console.log('云端不可用，尝试读取缓存')
        const cache = loadCache()
        if (cache && cache.records.length > 0) {
          console.log('使用缓存数据')
          applyCacheData(cache)
        } else {
          console.log('无缓存，使用本地模式')
          setChildren(localChildren)
          setCloudMode(false)
        }
      }
    } catch (err) {
      console.error('初始化失败:', err)
      setChildren(localChildren)
      setCloudMode(false)
    } finally {
      setLoading(false)
    }
  }

  function applyCacheData(cache: { children: Child[], records: any[], exchanges: any[] }) {
    setChildren(cache.children.length > 0 ? cache.children : localChildren)
    const cacheState: AppState = {
      currentChild: cache.children[0]?.id || '00000000-0000-0000-0000-000000000001',
      records: cache.records.map(adaptRecord),
      exchanges: cache.exchanges.map(adaptExchange),
      customTasks: [],
      customRewards: []
    }
    setState(cacheState)
    setCloudMode(false)
  }

  async function loadFromCloud() {
    const childList = await fetchChildren()
    setChildren(childList.length > 0 ? childList : localChildren)

    const allRecords: any[] = []
    const allExchanges: any[] = []
    
    for (const child of childList) {
      const recs = await fetchRecords(child.id)
      allRecords.push(...recs)
      const exs = await fetchExchanges(child.id)
      allExchanges.push(...exs)
    }

    // 保存到缓存
    saveCache({
      children: childList,
      records: allRecords,
      exchanges: allExchanges
    })

    const cloudState: AppState = {
      currentChild: childList[0]?.id || '00000000-0000-0000-0000-000000000001',
      records: allRecords.map(adaptRecord),
      exchanges: allExchanges.map(adaptExchange),
      customTasks: [],
      customRewards: []
    }
    setState(cloudState)
    setCloudMode(true)
    console.log('云端数据加载成功，共', allRecords.length, '条记录')
  }

  // 实时同步订阅
  const recordSubRef = useRef<ReturnType<typeof subscribeRecords>>(null)
  const exchangeSubRef = useRef<ReturnType<typeof subscribeExchanges>>(null)

  useEffect(() => {
    if (!cloudMode || !isConfigured) return

    const childId = state.currentChild

    recordSubRef.current?.unsubscribe()
    exchangeSubRef.current?.unsubscribe()

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

  // 数据变更方法
  const setCurrentChild = useCallback((childId: ChildId) => {
    setState(prev => ({ ...prev, currentChild: childId }))
  }, [])

  const addRecord = useCallback(async (record: Omit<PointRecord, 'id' | 'time'> & { date?: string }) => {
    const now = new Date()
    const date = record.date || now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5)
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const newRecord: PointRecord = {
      id: tempId,
      ...record,
      date,
      time,
      type: record.points > 0 ? 'earn' : 'redeem'
    }

    if (cloudMode) {
      try {
        const saved = await cloudAddRecord({
          child_id: newRecord.childId,
          task_id: newRecord.taskId,
          task_name: newRecord.taskName,
          task_category: (newRecord as any).taskCategory || '',
          points: newRecord.points,
          date: newRecord.date
        })
        newRecord.id = saved.id
      } catch (err) {
        console.error('云端保存失败，保存到本地:', err)
      }
    }
    
    setState(prev => ({ ...prev, records: [newRecord, ...prev.records] }))
    return newRecord
  }, [cloudMode])

  const addExchange = useCallback(async (exchange: Omit<ExchangeRecord, 'id' | 'date' | 'time'>) => {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5)
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const newExchange: ExchangeRecord = {
      id: tempId,
      ...exchange,
      date,
      time
    }

    if (cloudMode) {
      try {
        const saved = await cloudAddExchange({
          child_id: newExchange.childId,
          reward_name: newExchange.rewardName,
          reward_points: newExchange.points,
          date: newExchange.date
        })
        newExchange.id = saved.id
      } catch (err) {
        console.error('云端保存失败，保存到本地:', err)
      }
    }
    
    setState(prev => ({ ...prev, exchanges: [newExchange, ...prev.exchanges] }))
    return newExchange
  }, [cloudMode])

  const deleteRecord = useCallback(async (recordId: string) => {
    if (cloudMode) {
      try {
        await deleteRecordById(recordId)
      } catch (err) {
        console.error('云端删除失败:', err)
      }
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

import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import type { Child } from '../types'

// 硬编码配置
const SUPABASE_URL = 'https://hdkayzkpjmmxjkbxrglo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2F5emtwam1teGprYnhyZ2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTM0MTEsImV4cCI6MjA5MTQyOTQxMX0.qvJJ9XWQF6YZk-EXob2D58VBWlAMobcY3BFTPs-RjWA'

// 本地缓存 key
const CACHE_KEY = 'point-system-cloud-cache'
const CACHE_EXPIRE = 24 * 60 * 60 * 1000 // 24小时过期

// 创建客户端，增加超时时间到 15 秒
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
    }
  }
})

export const isConfigured = true

// 检测云端是否可用（增加到 10 秒超时）
export async function checkCloudAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/children?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

// 保存缓存
export function saveCache(data: { children: Child[], records: any[], exchanges: any[] }) {
  try {
    const cacheData = {
      ...data,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (e) {
    console.error('保存缓存失败:', e)
  }
}

// 读取缓存
export function loadCache(): { children: Child[], records: any[], exchanges: any[] } | null {
  try {
    const saved = localStorage.getItem(CACHE_KEY)
    if (!saved) return null
    
    const data = JSON.parse(saved)
    // 检查是否过期
    if (Date.now() - data.timestamp > CACHE_EXPIRE) {
      return null
    }
    return {
      children: data.children || [],
      records: data.records || [],
      exchanges: data.exchanges || []
    }
  } catch {
    return null
  }
}

export async function fetchChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .order('created_at')
  if (error) {
    console.error('fetchChildren error:', error)
    throw error
  }
  return data || []
}

export async function fetchRecords(childId: string, date?: string): Promise<any[]> {
  let query = supabase
    .from('records')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
  if (date) {
    query = query.eq('date', date)
  }
  const { data, error } = await query
  if (error) {
    console.error('fetchRecords error:', error)
    throw error
  }
  return data || []
}

export async function fetchExchanges(childId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('exchanges')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchExchanges error:', error)
    throw error
  }
  return data || []
}

// 数据库记录格式
interface DbRecord {
  child_id: string
  task_id: string
  task_name: string
  task_category: string
  points: number
  date: string
}

export async function addRecord(record: DbRecord): Promise<any> {
  const { data, error } = await supabase
    .from('records')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data
}

interface DbExchange {
  child_id: string
  reward_name: string
  reward_points: number
  date: string
}

export async function addExchangeRecord(exchange: DbExchange): Promise<any> {
  const { data, error } = await supabase
    .from('exchanges')
    .insert(exchange)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecordById(recordId: string): Promise<void> {
  const { error } = await supabase.from('records').delete().eq('id', recordId)
  if (error) throw error
}

export function subscribeRecords(childId: string, onChange: () => void): RealtimeChannel | null {
  return supabase
    .channel(`records-${childId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'records', filter: `child_id=eq.${childId}` },
      onChange
    )
    .subscribe()
}

export function subscribeExchanges(childId: string, onChange: () => void): RealtimeChannel | null {
  return supabase
    .channel(`exchanges-${childId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'exchanges', filter: `child_id=eq.${childId}` },
      onChange
    )
    .subscribe()
}

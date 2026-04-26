import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import type { Child, PointRecord, Exchange } from '../types'

// 硬编码配置 - 已确认正确
const SUPABASE_URL = 'https://hdkayzkpjmmxjkbxrglo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2F5emtwam1teGprYnhyZ2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTM0MTEsImV4cCI6MjA5MTQyOTQxMX0.qvJJ9XWQF6YZk-EXob2D58VBWlAMobcY3BFTPs-RjWA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const isConfigured = true

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

export async function fetchRecords(childId: string, date?: string): Promise<PointRecord[]> {
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
  return (data || []) as PointRecord[]
}

export async function fetchExchanges(childId: string): Promise<Exchange[]> {
  const { data, error } = await supabase
    .from('exchanges')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('fetchExchanges error:', error)
    throw error
  }
  return (data || []) as Exchange[]
}

export async function addRecord(record: Omit<PointRecord, 'id' | 'created_at'>): Promise<PointRecord> {
  const { data, error } = await supabase
    .from('records')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data as PointRecord
}

export async function addExchangeRecord(exchange: Omit<Exchange, 'id' | 'created_at'>): Promise<Exchange> {
  const { data, error } = await supabase
    .from('exchanges')
    .insert(exchange)
    .select()
    .single()
  if (error) throw error
  return data as Exchange
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

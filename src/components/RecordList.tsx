import { useState } from 'react'
import { PointRecord } from '../types'
import { tasks } from '../data/tasks'

interface Props {
  records: PointRecord[]
  showDate?: boolean
  onDelete?: (recordId: string) => void
  maxItems?: number  // 若设置，超出时显示"查看更多"
}

export function RecordList({ records, showDate = true, onDelete, maxItems }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">📋</div>
        <div>暂无记录</div>
      </div>
    )
  }

  const getTaskInfo = (taskId: string) => tasks.find(t => t.id === taskId)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) return '今天'
    if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天'
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 按日期分组
  const groupByDate = (recs: PointRecord[]) => {
    const groups: Record<string, PointRecord[]> = {}
    recs.forEach(r => {
      if (!groups[r.date]) groups[r.date] = []
      groups[r.date].push(r)
    })
    // 日期降序
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }

  // 若有 maxItems 且未展开，截断
  const visibleRecords = maxItems && !expanded ? records.slice(0, maxItems) : records
  const hasMore = maxItems ? records.length > maxItems : false

  // showDate=true 时按日期分组展示，showDate=false 时平铺（今日记录）
  if (showDate) {
    const groups = groupByDate(visibleRecords)
    return (
      <div className="space-y-4">
        {groups.map(([date, recs]) => {
          const dayTotal = recs.reduce((sum, r) => sum + r.points, 0)
          return (
            <div key={date}>
              {/* 日期标题 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">{formatDate(date)}</span>
                <span className={`text-sm font-bold ${dayTotal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {dayTotal > 0 ? `+${dayTotal}` : dayTotal} 分
                </span>
              </div>
              <div className="space-y-2">
                {recs.map(record => (
                  <RecordItem
                    key={record.id}
                    record={record}
                    isPositive={getTaskInfo(record.taskId)?.isPositive ?? record.points > 0}
                    showDate={false}
                    onDelete={onDelete}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2 text-sm text-blue-500 hover:text-blue-700"
          >
            查看更多 ({records.length - maxItems!} 条) ▼
          </button>
        )}
      </div>
    )
  }

  // 今日记录：平铺，不分组
  return (
    <div className="space-y-2">
      {visibleRecords.map(record => (
        <RecordItem
          key={record.id}
          record={record}
          isPositive={getTaskInfo(record.taskId)?.isPositive ?? record.points > 0}
          showDate={false}
          onDelete={onDelete}
          confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId}
        />
      ))}
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-2 text-sm text-blue-500 hover:text-blue-700"
        >
          查看全部今日记录 ({records.length} 条) ▼
        </button>
      )}
    </div>
  )
}

// 单条记录组件
function RecordItem({
  record,
  isPositive,
  showDate,
  onDelete,
  confirmDeleteId,
  setConfirmDeleteId
}: {
  record: PointRecord
  isPositive: boolean
  showDate: boolean
  onDelete?: (id: string) => void
  confirmDeleteId: string | null
  setConfirmDeleteId: (id: string | null) => void
}) {
  const isConfirming = confirmDeleteId === record.id

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-3 py-2 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {record.points > 0 ? `+${record.points}` : record.points}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 text-sm truncate">{record.taskName}</div>
        <div className="text-xs text-gray-400">
          {showDate && `${record.date} `}{record.time}
        </div>
      </div>

      {onDelete && (
        isConfirming ? (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => { onDelete(record.id); setConfirmDeleteId(null) }}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg"
            >
              确认
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-lg"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteId(record.id)}
            className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
            title="删除"
          >
            ×
          </button>
        )
      )}
    </div>
  )
}

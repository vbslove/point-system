import { ExchangeRecord } from '../types'

interface Props {
  exchanges: ExchangeRecord[]
}

export function ExchangeRecords({ exchanges }: Props) {
  if (exchanges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">🎁</div>
        <div>暂无兑换记录</div>
      </div>
    )
  }
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天'
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }
  
  return (
    <div className="space-y-2">
      {exchanges.map(exchange => (
        <div key={exchange.id} className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            🎁
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-800">{exchange.rewardName}</div>
            <div className="text-sm text-gray-400">
              {formatDate(exchange.date)} {exchange.time}
            </div>
          </div>
          <div className="text-red-500 font-bold">
            -{exchange.points}
          </div>
        </div>
      ))}
    </div>
  )
}

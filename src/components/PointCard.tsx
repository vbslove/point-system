import { ChildId } from '../types'
import { children } from '../data/children'

interface Props {
  childId: ChildId
  totalPoints: number
  todayPoints: number
  weekPoints: number
}

// 馒头图标
function MantouIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <ellipse cx="32" cy="46" rx="22" ry="12" fill="#F0D9B5"/>
      <ellipse cx="32" cy="38" rx="20" ry="13" fill="#F7E8CC"/>
      <ellipse cx="32" cy="28" rx="18" ry="15" fill="#FFF5E4"/>
      <ellipse cx="28" cy="22" rx="6" ry="4" fill="white" opacity="0.5"/>
      <path d="M18 36 Q32 30 46 36" fill="none" stroke="#E8C99A" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 42 Q32 37 44 42" fill="none" stroke="#E8C99A" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// 饺子图标
function JiaoziIcon() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <ellipse cx="32" cy="40" rx="24" ry="14" fill="#F7E8CC"/>
      <path d="M8 40 Q20 20 32 22 Q44 20 56 40 Z" fill="#FFF5E4"/>
      <path d="M14 36 Q20 28 26 30" fill="none" stroke="#E8C99A" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M50 36 Q44 28 38 30" fill="none" stroke="#E8C99A" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M26 30 Q32 24 38 30" fill="none" stroke="#E8C99A" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 36 Q18 32 22 34 Q26 30 30 32 Q34 28 38 30 Q42 28 46 32 Q50 32 50 36"
            fill="none" stroke="#D4A85A" strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="26" cy="32" rx="4" ry="2.5" fill="white" opacity="0.4"/>
    </svg>
  )
}

export function ChildAvatar({ childId, size = 64 }: { childId: string; size?: number }) {
  const isMantou = childId === 'mantou' || childId.endsWith('000000000001')
  const isJiaozi = childId === 'jiaozi' || childId.endsWith('000000000002')
  if (isMantou) return <MantouIcon />
  if (isJiaozi) return <JiaoziIcon />
  return <span style={{ fontSize: size * 0.6 }}>👦</span>
}

export function PointCard({ childId, totalPoints, todayPoints, weekPoints }: Props) {
  const child = children.find(c => c.id === childId)!

  // 今日/本周可能包含减分，格式化显示
  const formatPoints = (pts: number) => {
    if (pts > 0) return `+${pts}`
    if (pts < 0) return `${pts}`
    return '0'
  }

  return (
    <div className="card text-center">
      <div className="flex justify-center mb-2">
        <ChildAvatar childId={childId} size={64} />
      </div>
      <div className="text-xl font-medium text-gray-800 mb-4">{child.name} 的积分</div>

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 mb-4">
        <div className="text-5xl font-bold mb-1">{totalPoints}</div>
        <div className="text-blue-100">当前积分</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-xl p-3">
          <div className={`text-2xl font-bold ${todayPoints >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatPoints(todayPoints)}
          </div>
          <div className="text-sm text-gray-500">今日获得</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-3">
          <div className={`text-2xl font-bold ${weekPoints >= 0 ? 'text-purple-600' : 'text-red-500'}`}>
            {formatPoints(weekPoints)}
          </div>
          <div className="text-sm text-gray-500">本周获得</div>
        </div>
      </div>
    </div>
  )
}

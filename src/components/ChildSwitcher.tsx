import { Child } from '../types'
import { ChildAvatar } from './PointCard'

interface Props {
  current: string
  onChange: (id: string) => void
  children: Child[]
}

export function ChildSwitcher({ current, onChange, children }: Props) {
  // 如果 children 为空，显示加载中
  if (!children || children.length === 0) {
    return (
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        <div className="flex-1 py-3 px-4 text-center text-gray-400">
          加载孩子信息...
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      {children.map(child => (
        <button
          key={child.id}
          onClick={() => onChange(child.id)}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            current === child.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <ChildAvatar childId={child.id} size={32} />
          </div>
          <span>{child.name}</span>
        </button>
      ))}
    </div>
  )
}

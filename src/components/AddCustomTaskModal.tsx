import { useState, useEffect } from 'react'
import { Task } from '../types'
import { categoryNames } from '../data/tasks'

interface AddCustomTaskModalProps {
  /** 传入 task 时为编辑模式，不传时为新增模式 */
  editingTask?: Task
  onSave: (task: Omit<Task, 'id' | 'isCustom'>) => void
  onDelete?: (taskId: string) => void
  onClose: () => void
}

const categoryOrder = ['study-habit', 'study-subject', 'life', 'moral'] as const

export function AddCustomTaskModal({ editingTask, onSave, onDelete, onClose }: AddCustomTaskModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('study-habit')
  const [points, setPoints] = useState('')
  const [isPositive, setIsPositive] = useState(true)
  const [error, setError] = useState('')

  // 锁定背景滚动
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = ''
    }
  }, [])

  // 编辑模式下回填数据
  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name)
      setCategory(editingTask.category)
      setPoints(Math.abs(editingTask.points).toString())
      setIsPositive(editingTask.isPositive)
    }
  }, [editingTask])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请输入规则名称')
      return
    }
    const pts = parseInt(points, 10)
    if (isNaN(pts) || pts <= 0) {
      setError('请输入正数分数')
      return
    }
    setError('')
    onSave({
      name: trimmed,
      category: category as Task['category'],
      points: isPositive ? pts : -pts,
      isPositive
    })
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">
            {editingTask ? '✏️ 编辑规则' : '➕ 新增规则'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 规则名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：主动收拾玩具"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <div className="grid grid-cols-2 gap-2">
              {categoryOrder.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-blue-500 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category === cat ? '✅ ' : ''}{categoryNames[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* 类型切换 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setIsPositive(true); setPoints('') }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  isPositive ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                🟢 加分
              </button>
              <button
                type="button"
                onClick={() => { setIsPositive(false); setPoints('') }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  !isPositive ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                🔴 减分
              </button>
            </div>
          </div>

          {/* 分数 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分值（{isPositive ? '正数' : '负数'}）
            </label>
            <input
              type="number"
              value={points}
              onChange={e => setPoints(e.target.value)}
              placeholder="输入分值，如 5"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* 预览 */}
          {name && points && (
            <div className={`text-center py-2 rounded-xl text-sm font-medium ${
              isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              预览：{name}（{isPositive ? '+' : ''}{isPositive ? points : `-${points}`}分）
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-1">
            {editingTask && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`确定删除规则「${editingTask.name}」？`)) {
                    onDelete(editingTask.id)
                    onClose()
                  }
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                🗑 删除
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              {editingTask ? '💾 保存修改' : '✅ 添加规则'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Reward } from '../types'

interface Props {
  open: boolean
  editReward?: Reward | null
  onClose: () => void
  onSave: (reward: Omit<Reward, 'id' | 'isCustom'>) => void
  onDelete?: (rewardId: string) => void
}

const typeOptions: { value: Reward['type']; label: string; icon: string }[] = [
  { value: 'food', label: '美食', icon: '🍽️' },
  { value: 'entertainment', label: '娱乐', icon: '🎮' },
  { value: 'activity', label: '活动', icon: '🎢' },
  { value: 'custom', label: '自定义', icon: '🎁' },
]

export function AddCustomRewardModal({ open, editReward, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<Reward['type']>('activity')
  const [isRatio, setIsRatio] = useState(false)
  const [points, setPoints] = useState('')
  const [ratioPoints, setRatioPoints] = useState('10')
  const [note, setNote] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isEdit = !!editReward

  useEffect(() => {
    if (!open) return
    const originalStyle = window.getComputedStyle(document.body)
    const originalOverflow = originalStyle.overflow
    const originalPaddingRight = originalStyle.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
    }
  }, [open])

  useEffect(() => {
    if (editReward) {
      setName(editReward.name)
      setType(editReward.type)
      setIsRatio(editReward.isRatio)
      setPoints(editReward.isRatio ? '10' : String(editReward.points || ''))
      setRatioPoints(String(editReward.points || 10))
      setNote(editReward.note || '')
    } else {
      setName('')
      setType('activity')
      setIsRatio(false)
      setPoints('')
      setRatioPoints('10')
      setNote('')
    }
    setShowDeleteConfirm(false)
  }, [editReward, open])

  const isValid = name.trim().length > 0 && (isRatio ? true : points)

  const handleSave = () => {
    if (!isValid) return
    onSave({
      name: name.trim(),
      type,
      isRatio,
      points: isRatio ? parseInt(ratioPoints) || 10 : parseInt(points) || 0,
      note: note.trim() || undefined,
    })
  }

  const handleDelete = () => {
    if (editReward && onDelete) {
      onDelete(editReward.id)
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-white rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        <div className="flex items-center justify-between px-6 py-3 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? '✏️ 编辑兑换规则' : '➕ 添加兑换规则'}
          </h2>
          {isEdit && onDelete && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-500 hover:text-red-600"
            >
              删除
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 pb-6">
          {showDeleteConfirm && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-sm text-red-700 mb-3">确定要删除「{editReward?.name}」吗？</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-lg text-sm bg-red-500 text-white"
                >
                  确认删除
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">奖励名称</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：看一集喜欢的动画"
                maxLength={20}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <div className="grid grid-cols-4 gap-2">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      type === opt.value
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <div>{opt.icon}</div>
                    <div>{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">积分方式</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsRatio(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    !isRatio ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  固定积分
                </button>
                <button
                  onClick={() => setIsRatio(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    isRatio ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  按比例
                </button>
              </div>
            </div>

            {!isRatio ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所需积分</label>
                <input
                  type="number"
                  value={points}
                  onChange={e => setPoints(e.target.value)}
                  placeholder="例如：50"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">兑换比例（消耗几分积1分）</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={ratioPoints}
                    onChange={e => setRatioPoints(e.target.value)}
                    className="w-24 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-sm text-gray-500">积分 = 1元</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="例如：只限周末"
                maxLength={30}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium border-2 border-gray-200 text-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all ${
                isValid ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isEdit ? '保存修改' : '添加规则'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

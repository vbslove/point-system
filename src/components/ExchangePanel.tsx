import { useState } from 'react'
import { ChildId, Reward } from '../types'
import { rewards as builtinRewards } from '../data/rewards'
import { rewardTypeNames } from '../data/rewards'
import { AddCustomRewardModal } from './AddCustomRewardModal'

interface Props {
  childId: ChildId
  currentPoints: number
  customRewards: Reward[]
  onExchange: (reward: Reward, customPoints?: number) => void
  onAddCustomReward: (reward: Omit<Reward, 'id' | 'isCustom'>) => void
  onUpdateCustomReward: (rewardId: string, updates: Partial<Omit<Reward, 'id' | 'isCustom'>>) => void
  onDeleteCustomReward: (rewardId: string) => void
}

export function ExchangePanel({
  childId,
  currentPoints,
  customRewards,
  onExchange,
  onAddCustomReward,
  onUpdateCustomReward,
  onDeleteCustomReward,
}: Props) {
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [customPoints, setCustomPoints] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // 自定义规则弹窗
  const [modalOpen, setModalOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)

  // 菜单
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const allRewards = [...builtinRewards, ...(customRewards ?? [])]

  const handleRewardClick = (reward: Reward) => {
    setMenuOpenId(null)
    setSelectedReward(reward)
    if (reward.isRatio || reward.type === 'custom') {
      setCustomPoints('')
    }
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    if (!selectedReward) return
    let pointsToSpend: number

    if (selectedReward.isRatio) {
      pointsToSpend = (Number(customPoints) || 0) * (selectedReward.ratioPoints ?? 10)
    } else if (selectedReward.type === 'custom' && !selectedReward.isCustom) {
      // 内置"自定义"类型（买零食/玩具）
      pointsToSpend = (parseInt(customPoints) || 0) * 10
    } else {
      pointsToSpend = selectedReward.points
    }

    if (pointsToSpend > 0 && pointsToSpend <= currentPoints) {
      onExchange(selectedReward, pointsToSpend)
      setSelectedReward(null)
      setShowConfirm(false)
      setCustomPoints('')
    }
  }

  const handleCancel = () => {
    setSelectedReward(null)
    setShowConfirm(false)
    setCustomPoints('')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'food': return '🍽️'
      case 'entertainment': return '🎮'
      case 'activity': return '🎢'
      case 'custom': return '🎁'
      default: return '🎁'
    }
  }

  const groupRewards = () => {
    const groups: Record<string, Reward[]> = {}
    allRewards.forEach(reward => {
      const key = reward.type
      if (!groups[key]) groups[key] = []
      groups[key].push(reward)
    })
    return groups
  }

  // 判断是否需要输入数量（比例型 or 内置custom类型）
  const needsInput = (r: Reward) => r.isRatio || (r.type === 'custom' && !r.isCustom)

  // 积分消耗预览
  const previewPoints = (r: Reward) => {
    if (r.isRatio) return (Number(customPoints) || 0) * (r.ratioPoints ?? 10)
    if (r.type === 'custom' && !r.isCustom) return (parseInt(customPoints) || 0) * 10
    return r.points
  }

  const canAfford = (r: Reward) => {
    if (needsInput(r)) return true  // 需要输入时先不限
    return r.points <= currentPoints
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">🎁 奖励兑换</h2>
        <div className="text-sm text-gray-500">
          可用积分: <span className="font-bold text-blue-600">{currentPoints}</span>
        </div>
      </div>

      {!showConfirm ? (
        <div className="space-y-4">
          {Object.entries(groupRewards()).map(([type, typeRewards]) => (
            <div key={type}>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {getTypeIcon(type)} {rewardTypeNames[type] ?? type}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {typeRewards.map(reward => {
                  const affordable = canAfford(reward)
                  const shortage = !needsInput(reward) ? reward.points - currentPoints : 0
                  return (
                    <div key={reward.id} className="relative">
                      <button
                        onClick={() => handleRewardClick(reward)}
                        disabled={!needsInput(reward) && !affordable}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                          affordable
                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`font-medium text-sm pr-5 ${affordable ? 'text-gray-800' : 'text-gray-400'}`}>
                          {reward.name}
                          {reward.isCustom && (
                            <span className="ml-1 text-xs text-purple-400">✏️</span>
                          )}
                        </div>
                        <div className={`text-sm mt-0.5 ${affordable ? 'text-blue-600' : 'text-gray-400'}`}>
                          {reward.isRatio ? (
                            <span>{reward.ratioPoints ?? 10}分=1单位</span>
                          ) : reward.type === 'custom' && !reward.isCustom ? (
                            <span>10分=1元（自定义）</span>
                          ) : (
                            <span>{reward.points}分</span>
                          )}
                        </div>
                        {!affordable && shortage > 0 && (
                          <div className="text-xs text-orange-400 mt-1">还差 {shortage} 分</div>
                        )}
                        {reward.note && affordable && (
                          <div className="text-xs text-gray-400 mt-1">{reward.note}</div>
                        )}
                      </button>

                      {/* 自定义规则的编辑菜单 */}
                      {reward.isCustom && (
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setMenuOpenId(prev => prev === reward.id ? null : reward.id)
                            }}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 text-xs"
                          >
                            ⋮
                          </button>
                          {menuOpenId === reward.id && (
                            <div
                              className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-28 overflow-hidden"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setMenuOpenId(null)
                                  setEditingReward(reward)
                                  setModalOpen(true)
                                }}
                                className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                ✏️ 编辑
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* 添加自定义按钮 */}
          <button
            onClick={() => {
              setEditingReward(null)
              setModalOpen(true)
            }}
            className="w-full mt-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            ➕ 添加自定义兑换规则
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">{getTypeIcon(selectedReward!.type)}</div>
          <div className="text-xl font-medium text-gray-800 mb-2">{selectedReward!.name}</div>

          {needsInput(selectedReward!) ? (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">
                {selectedReward!.isRatio
                  ? `可用: ${currentPoints}分，输入单位数量`
                  : `输入购买金额（可用: ${currentPoints}分 = ${Math.floor(currentPoints / 10)}元）`}
              </div>
              <input
                type="number"
                value={customPoints}
                onChange={e => setCustomPoints(e.target.value)}
                placeholder={selectedReward!.isRatio ? '数量' : '元'}
                min={1}
                className="w-32 text-center text-2xl font-bold border-2 border-blue-300 rounded-xl py-2 focus:outline-none focus:border-blue-500"
              />
              <div className="text-sm text-gray-500 mt-2">
                = {previewPoints(selectedReward!)} 分
              </div>
            </div>
          ) : (
            <div className="text-3xl font-bold text-blue-600 mb-6">
              {selectedReward!.points} 分
            </div>
          )}

          <div className="text-sm text-gray-400 mb-4">
            兑换后剩余: {currentPoints - previewPoints(selectedReward!)} 分
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={handleCancel} className="btn-secondary">取消</button>
            <button
              onClick={handleConfirm}
              disabled={needsInput(selectedReward!) && (!customPoints || Number(customPoints) <= 0)}
              className="btn-primary"
            >
              确认兑换
            </button>
          </div>
        </div>
      )}

      {/* 点击遮罩关闭菜单 */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}

      {/* 自定义规则弹窗 */}
      <AddCustomRewardModal
        open={modalOpen}
        editReward={editingReward}
        onClose={() => {
          setModalOpen(false)
          setEditingReward(null)
        }}
        onSave={reward => {
          if (editingReward) {
            onUpdateCustomReward(editingReward.id, reward)
          } else {
            onAddCustomReward(reward)
          }
          setModalOpen(false)
          setEditingReward(null)
        }}
        onDelete={rewardId => {
          onDeleteCustomReward(rewardId)
          setModalOpen(false)
          setEditingReward(null)
        }}
      />
    </div>
  )
}

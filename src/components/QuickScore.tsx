import { useState } from 'react'
import { Task } from '../types'
import { categoryNames } from '../data/tasks'
import { AddCustomTaskModal } from './AddCustomTaskModal'

interface QuickScoreProps {
  tasks: Task[]
  customTasks: Task[]
  onScore: (task: Task, dates: string[]) => void
  onAddCustomTask: (task: Omit<Task, 'id' | 'isCustom'>) => void
  onUpdateCustomTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'isCustom'>>) => void
  onDeleteCustomTask: (taskId: string) => void
  currentChild: string
}

export function QuickScore({
  tasks,
  customTasks,
  onScore,
  onAddCustomTask,
  onUpdateCustomTask,
  onDeleteCustomTask,
  currentChild: _currentChild
}: QuickScoreProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  // 生成日期选项：最近7天
  const getDateOptions = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? '今天' : i === 1 ? '昨天' : `${i}天前`
      })
    }
    return dates
  }

  const dateOptions = getDateOptions()

  const toggleDate = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const handleConfirm = () => {
    if (selectedTask && selectedDates.length > 0) {
      onScore(selectedTask, selectedDates)
      setSelectedTask(null)
      setSelectedDates([])
    }
  }

  const handleCancel = () => {
    setSelectedTask(null)
    setSelectedDates([])
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setSelectedDates([dateOptions[0].value])
  }

  const handleEditCustom = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTask(task)
    setShowModal(true)
    setActiveMenu(null)
  }

  const handleSaveCustom = (taskData: Omit<Task, 'id' | 'isCustom'>) => {
    if (editingTask) {
      onUpdateCustomTask(editingTask.id, taskData)
    } else {
      onAddCustomTask(taskData)
    }
    setEditingTask(undefined)
  }

  // 合并内置 + 自定义任务
  const allTasks = [...tasks, ...customTasks]

  // 按 category 分组（顺序固定）
  const categoryOrder = ['study-habit', 'study-subject', 'life', 'moral']
  const categories: Array<{ key: string; positiveTasks: Task[]; negativeTasks: Task[] }> = categoryOrder
    .map(cat => ({
      key: cat,
      positiveTasks: allTasks.filter(t => t.category === cat && t.isPositive),
      negativeTasks: allTasks.filter(t => t.category === cat && !t.isPositive),
    })).filter(g => g.positiveTasks.length > 0 || g.negativeTasks.length > 0)

  // 自定义规则（不属于标准分类的兜底）
  // 如果有自定义但分类不对，归入对应分类即可

  // 选中了任务 → 显示日期选择
  if (selectedTask) {
    const totalPoints = selectedDates.length * selectedTask.points
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800">📅 选择日期（可多选）</h2>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-xl flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">已选任务：</span>
          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
            selectedTask.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {selectedTask.name}（{selectedTask.isPositive ? '+' : ''}{selectedTask.points}分）
          </span>
          {selectedTask.isCustom && (
            <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">自定义</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {dateOptions.map(date => (
            <button
              key={date.value}
              onClick={() => toggleDate(date.value)}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                selectedDates.includes(date.value)
                  ? selectedTask.isPositive
                    ? 'bg-green-500 text-white'
                    : 'bg-red-400 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {date.label}
              <div className="text-xs opacity-75 mt-0.5">{date.value.slice(5)}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedDates(dateOptions.map(d => d.value))}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >全选</button>
          <button
            onClick={() => setSelectedDates([])}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >清空</button>
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedDates.length === 0}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            selectedDates.length > 0
              ? selectedTask.isPositive
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedDates.length > 0
            ? `确认 ${selectedDates.length}天 × ${selectedTask.isPositive ? '+' : ''}${selectedTask.points} = ${totalPoints > 0 ? '+' : ''}${totalPoints}分`
            : '请先选择日期'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {categories.map(({ key, positiveTasks, negativeTasks }) => (
        <div key={key} className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
            {key === 'study-habit' ? '📒' : key === 'study-subject' ? '📖' : key === 'life' ? '🌱' : '💛'} {categoryNames[key]}
          </h2>

          {/* 加分项 */}
          {positiveTasks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {positiveTasks.map(task => (
                <div key={task.id} className="relative">
                  <button
                    onClick={() => handleTaskClick(task)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-200 transition-colors border border-green-200"
                  >
                    {task.name}
                    <span className="ml-1 text-xs text-green-500">+{task.points}</span>
                    {task.isCustom && <span className="ml-1 text-xs">✏️</span>}
                  </button>
                  {task.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(activeMenu === task.id ? null : task.id)
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-200 text-gray-500 text-xs rounded-full flex items-center justify-center hover:bg-gray-300"
                    >⋮</button>
                  )}
                  {/* 编辑菜单 */}
                  {activeMenu === task.id && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden text-xs w-28">
                      <button
                        onClick={(e) => handleEditCustom(task, e)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 text-blue-600"
                      >✏️ 编辑</button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`确定删除「${task.name}」？`)) {
                            onDeleteCustomTask(task.id)
                            setActiveMenu(null)
                          }
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-500"
                      >🗑 删除</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 减分项 */}
          {negativeTasks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {negativeTasks.map(task => (
                <div key={task.id} className="relative">
                  <button
                    onClick={() => handleTaskClick(task)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200 transition-colors border border-red-200"
                  >
                    {task.name}
                    <span className="ml-1 text-xs text-red-400">{task.points}</span>
                    {task.isCustom && <span className="ml-1 text-xs">✏️</span>}
                  </button>
                  {task.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenu(activeMenu === task.id ? null : task.id)
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-200 text-gray-500 text-xs rounded-full flex items-center justify-center hover:bg-gray-300"
                    >⋮</button>
                  )}
                  {activeMenu === task.id && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden text-xs w-28">
                      <button
                        onClick={(e) => handleEditCustom(task, e)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 text-blue-600"
                      >✏️ 编辑</button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`确定删除「${task.name}」？`)) {
                            onDeleteCustomTask(task.id)
                            setActiveMenu(null)
                          }
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-500"
                      >🗑 删除</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 底部添加按钮 */}
      <div className="card">
        <button
          onClick={() => { setEditingTask(undefined); setShowModal(true) }}
          className="w-full py-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border-2 border-dashed border-blue-300 transition-colors"
        >
          ➕ 添加自定义积分规则
        </button>
      </div>

      {/* 弹窗 */}
      {showModal && (
        <AddCustomTaskModal
          editingTask={editingTask}
          onSave={handleSaveCustom}
          onDelete={onDeleteCustomTask}
          onClose={() => { setShowModal(false); setEditingTask(undefined) }}
        />
      )}
    </div>
  )
}

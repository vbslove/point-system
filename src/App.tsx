import { useState } from 'react'
import { useStore } from './hooks/useStore'
import { ChildSwitcher } from './components/ChildSwitcher'
import { PointCard } from './components/PointCard'
import { QuickScore } from './components/QuickScore'
import { RecordList } from './components/RecordList'
import { ExchangePanel } from './components/ExchangePanel'
import { ExchangeRecords } from './components/ExchangeRecords'
import { DataBackup } from './components/DataBackup'
import { Task, Reward, AppState } from './types'
import { tasks } from './data/tasks'

type Tab = 'home' | 'records' | 'exchange'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const {
    state,
    setCurrentChild,
    children,
    loading,
    addRecord,
    addExchange,
    deleteRecord,
    importState,
    addCustomTask,
    updateCustomTask,
    deleteCustomTask,
    addCustomReward,
    updateCustomReward,
    deleteCustomReward,
    getChildPoints,
    getTodayPoints,
    getWeekPoints,
    getRecordsByChild,
    getExchangesByChild
  } = useStore()

  const currentPoints = getChildPoints(state.currentChild)
  const todayPoints = getTodayPoints(state.currentChild)
  const weekPoints = getWeekPoints(state.currentChild)
  const records = getRecordsByChild(state.currentChild)
  const exchanges = getExchangesByChild(state.currentChild)

  // 今日记录
  const today = new Date().toISOString().split('T')[0]
  const todayRecords = records.filter(r => r.date === today)

  const handleScore = (task: Task, dates: string[]) => {
    dates.forEach(date => {
      addRecord({
        childId: state.currentChild,
        taskId: task.id,
        taskName: task.name,
        taskCategory: task.category,
        points: task.points,
        type: 'earn',
        date
      })
    })
    const total = dates.length * task.points
    showSuccessMessage(
      `${dates.length > 1 ? `${dates.length}天 × ` : ''}${task.isPositive ? '+' : ''}${task.points}${dates.length > 1 ? ` = ${total > 0 ? '+' : ''}${total}` : ''}分`
    )
  }

  const handleExchange = (reward: Reward, customPoints?: number) => {
    const pointsToSpend = customPoints || reward.points
    addExchange({
      childId: state.currentChild,
      rewardId: reward.id,
      rewardName: reward.name,
      points: pointsToSpend
    })
    showSuccessMessage(`已兑换 ${reward.name} 🎉`)
  }

  const handleDeleteRecord = (recordId: string) => {
    deleteRecord(recordId)
    showSuccessMessage('已删除记录')
  }

  const handleImport = (newState: AppState) => {
    importState(newState)
  }

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2500)
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-white shadow-sm z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center text-gray-800">🏠 家庭积分管理</h1>
        </div>
      </header>

      {/* Main Content - 可滚动 */}
      <main className="flex-1 overflow-y-auto max-w-lg mx-auto px-4 py-4 space-y-4 w-full pb-24">
        {/* Child Switcher */}
        <ChildSwitcher
          current={state.currentChild}
          onChange={setCurrentChild}
          children={children}
        />

        {/* Tab Content */}
        {activeTab === 'home' && (
          <>
            <PointCard
              childId={state.currentChild}
              totalPoints={currentPoints}
              todayPoints={todayPoints}
              weekPoints={weekPoints}
            />

            <QuickScore
              tasks={tasks}
              customTasks={state.customTasks}
              onScore={handleScore}
              onAddCustomTask={addCustomTask}
              onUpdateCustomTask={updateCustomTask}
              onDeleteCustomTask={deleteCustomTask}
              currentChild={state.currentChild}
            />

            {todayRecords.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-medium text-gray-800 mb-3">📋 今日记录</h2>
                <RecordList
                  records={todayRecords}
                  showDate={false}
                  onDelete={handleDeleteRecord}
                  maxItems={5}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'records' && (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-800 mb-4">📋 全部记录</h2>
            <RecordList
              records={records}
              onDelete={handleDeleteRecord}
            />
          </div>
        )}

        {activeTab === 'exchange' && (
          <>
            <ExchangePanel
              childId={state.currentChild}
              currentPoints={currentPoints}
              customRewards={state.customRewards ?? []}
              onExchange={handleExchange}
              onAddCustomReward={addCustomReward}
              onUpdateCustomReward={updateCustomReward}
              onDeleteCustomReward={deleteCustomReward}
            />

            <div className="card">
              <h2 className="text-lg font-medium text-gray-800 mb-4">🎁 兑换历史</h2>
              <ExchangeRecords exchanges={exchanges} />
            </div>

            <DataBackup state={state} onImport={handleImport} />
          </>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-lg mx-auto flex">
          {[
            { key: 'home', icon: '🏠', label: '首页' },
            { key: 'records', icon: '📋', label: '记录' },
            { key: 'exchange', icon: '🎁', label: '兑换' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`flex-1 py-4 text-center transition-colors ${
                activeTab === tab.key ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{tab.icon}</div>
              <div className="text-xs">{tab.label}</div>
            </button>
          ))}
        </div>
      </nav>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 whitespace-nowrap animate-bounce">
          ✅ {successMessage}
        </div>
      )}
    </div>
  )
}

export default App

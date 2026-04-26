import { AppState } from '../types'
import { children } from '../data/children'

interface Props {
  state: AppState
  onImport: (state: AppState) => void
}

export function DataBackup({ state, onImport }: Props) {
  // 导出 JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]
    a.href = url
    a.download = `积分备份_${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导出 CSV（方便在手机上查看）
  const handleExportCSV = () => {
    const rows = [['孩子', '任务', '积分', '日期', '时间', '类型']]
    state.records.forEach(r => {
      const child = children.find(c => c.id === r.childId)?.name || r.childId
      rows.push([child, r.taskName, String(r.points), r.date, r.time, r.type === 'earn' ? '获得' : '兑换'])
    })
    state.exchanges.forEach(e => {
      const child = children.find(c => c.id === e.childId)?.name || e.childId
      rows.push([child, e.rewardName, String(-e.points), e.date, e.time, '兑换奖励'])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]
    a.href = url
    a.download = `积分记录_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入 JSON
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string) as AppState
          if (imported.records && imported.exchanges) {
            onImport(imported)
            alert(`✅ 导入成功！共 ${imported.records.length} 条记录`)
          } else {
            alert('❌ 文件格式不正确')
          }
        } catch {
          alert('❌ 文件解析失败')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const totalRecords = state.records.length
  const totalExchanges = state.exchanges.length

  return (
    <div className="card">
      <h2 className="text-lg font-medium text-gray-800 mb-1">💾 数据备份</h2>
      <p className="text-sm text-gray-400 mb-4">
        共 {totalRecords} 条积分记录，{totalExchanges} 条兑换记录
      </p>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleExport}
          className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          📦 备份
        </button>
        <button
          onClick={handleExportCSV}
          className="py-2.5 px-3 rounded-xl bg-green-50 text-green-600 text-sm font-medium hover:bg-green-100 transition-colors"
        >
          📊 导出CSV
        </button>
        <button
          onClick={handleImport}
          className="py-2.5 px-3 rounded-xl bg-orange-50 text-orange-600 text-sm font-medium hover:bg-orange-100 transition-colors"
        >
          📥 恢复
        </button>
      </div>
      <p className="text-xs text-gray-300 mt-3 text-center">
        换设备前请先备份，恢复会覆盖当前数据
      </p>
    </div>
  )
}

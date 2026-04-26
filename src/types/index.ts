export type ChildId = string

export interface Child {
  id: ChildId
  name: string
  avatar: string
  avatarType?: 'emoji' | 'svg'
}

export interface Task {
  id: string
  name: string
  category: 'study-habit' | 'study-subject' | 'life' | 'moral'
  points: number
  isPositive: boolean
  isCustom?: boolean
}

export interface Reward {
  id: string
  name: string
  points: number
  type: 'food' | 'entertainment' | 'activity' | 'custom'
  note?: string
  isCustom?: boolean
  isRatio?: boolean
  ratioPoints?: number
}

export interface PointRecord {
  id: string
  childId: ChildId
  taskId: string
  taskName: string
  taskCategory: string
  points: number
  date: string
  time: string
  type: 'earn' | 'redeem'
}

export interface ExchangeRecord {
  id: string
  childId: ChildId
  rewardId: string
  rewardName: string
  points: number
  date: string
  time: string
}

export interface AppState {
  currentChild: ChildId
  records: PointRecord[]
  exchanges: ExchangeRecord[]
  customTasks: Task[]
  customRewards: Reward[]
}

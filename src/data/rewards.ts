import { Reward } from '../types'

export const rewards: Reward[] = [
  { id: 'reward-1', name: '外出吃饭（非大餐）', points: 50, type: 'food' },
  { id: 'reward-2', name: '玩平板或看电视15分钟', points: 100, type: 'entertainment' },
  { id: 'reward-3', name: '外出吃大餐', points: 150, type: 'food' },
  { id: 'reward-4', name: '买零食', points: 10, type: 'custom', note: '10分=1元（自定义金额）' },
  { id: 'reward-5', name: '买玩具', points: 10, type: 'custom', note: '10分=1元（自定义金额）' },
  { id: 'reward-6', name: '自由安排周末半天', points: 100, type: 'activity' },
  { id: 'reward-7', name: '周末出游决定权一次', points: 100, type: 'activity' },
  { id: 'reward-8', name: '自由安排周末一天', points: 150, type: 'activity' },
  { id: 'reward-9', name: '成都内旅游一趟', points: 1000, type: 'activity' },
  { id: 'reward-10', name: '出成都且四川省内旅游一趟', points: 2000, type: 'activity' },
  { id: 'reward-11', name: '出四川省且国内旅游一趟', points: 3000, type: 'activity' },
]

export const rewardTypeNames: Record<string, string> = {
  food: '美食',
  entertainment: '娱乐',
  activity: '活动',
  custom: '自定义'
}

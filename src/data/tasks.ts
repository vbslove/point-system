import { Task } from '../types'

export const tasks: Task[] = [
  // ========== 学习习惯 ==========
  { id: 'study-habit-1', name: '坐姿、握笔姿势标准', category: 'study-habit', points: 5, isPositive: true },
  { id: 'study-habit-2', name: '学习中不拖拉/不被其他吸引', category: 'study-habit', points: 5, isPositive: true },
  { id: 'study-habit-3', name: '玩具当天回家', category: 'study-habit', points: 10, isPositive: true },
  { id: 'study-habit-4', name: '学习完后收拾书桌', category: 'study-habit', points: 5, isPositive: true },
  { id: 'study-habit-5', name: '读英语（新东方）20分钟', category: 'study-habit', points: 10, isPositive: true },

  // ========== 学习科目 ==========
  { id: 'study-subject-1', name: '口算大通关1页', category: 'study-subject', points: 5, isPositive: true },
  { id: 'study-subject-2', name: '字帖1页', category: 'study-subject', points: 5, isPositive: true },
  { id: 'study-subject-3', name: '英语课外书1本', category: 'study-subject', points: 10, isPositive: true },
  { id: 'study-subject-4', name: '自己读绘本', category: 'study-subject', points: 10, isPositive: true },
  { id: 'study-subject-5', name: '奖状', category: 'study-subject', points: 10, isPositive: true },
  { id: 'study-subject-6', name: '下国际象棋', category: 'study-subject', points: 5, isPositive: true },

  // ========== 生活习惯 - 加分 ==========
  { id: 'life-1', name: '晚上九点半上床睡觉', category: 'life', points: 5, isPositive: true },
  { id: 'life-2', name: '主动做家务（叠被子、收拾桌子、扫拖地、拿快递等）', category: 'life', points: 5, isPositive: true },
  { id: 'life-3', name: '每日运动30分钟', category: 'life', points: 5, isPositive: true },
  { id: 'life-4', name: '自己洗澡洗头', category: 'life', points: 5, isPositive: true },
  { id: 'life-5', name: '不主动要别人的东西', category: 'life', points: 3, isPositive: true },
  { id: 'life-6', name: '收拾外婆乱扔的东西', category: 'life', points: 3, isPositive: true },
  { id: 'life-7', name: '不影响爸妈工作', category: 'life', points: 3, isPositive: true },
  { id: 'life-8', name: '早上自己找衣服穿', category: 'life', points: 5, isPositive: true },
  { id: 'life-9', name: '没尿在尿不湿', category: 'life', points: 10, isPositive: true },

  // ========== 生活习惯 - 减分 ==========
  { id: 'life-10', name: '超过十点睡觉', category: 'life', points: -50, isPositive: false },
  { id: 'life-11', name: '十点半睡觉', category: 'life', points: -200, isPositive: false },
  { id: 'life-12', name: '非假期看电视/平板/手机', category: 'life', points: -50, isPositive: false },
  { id: 'life-13', name: '抱家长大腿', category: 'life', points: -10, isPositive: false },
  { id: 'life-14', name: '后洗完澡不放水不收毛巾', category: 'life', points: -5, isPositive: false },
  { id: 'life-15', name: '脏衣服不放盆子里', category: 'life', points: -10, isPositive: false },
  { id: 'life-16', name: '不遵守交通规则', category: 'life', points: -10, isPositive: false },

  // ========== 性格养成 - 加分 ==========
  { id: 'moral-1', name: '一天不乱发脾气', category: 'moral', points: 3, isPositive: true },
  { id: 'moral-2', name: '公共场合不大声喧哗', category: 'moral', points: 2, isPositive: true },
  { id: 'moral-3', name: '遇到难题想办法解决', category: 'moral', points: 5, isPositive: true },
  { id: 'moral-4', name: '遇到问题不哭', category: 'moral', points: 5, isPositive: true },
  { id: 'moral-5', name: '勇于尝试新事物', category: 'moral', points: 10, isPositive: true },
  { id: 'moral-6', name: '和家长分享学校见闻', category: 'moral', points: 5, isPositive: true },
  { id: 'moral-7', name: '主动问好', category: 'moral', points: 2, isPositive: true },
  { id: 'moral-8', name: '主动道歉', category: 'moral', points: 2, isPositive: true },
  { id: 'moral-9', name: '不讲脏话', category: 'moral', points: 2, isPositive: true },

  // ========== 性格养成 - 减分 ==========
  { id: 'moral-10', name: '打架', category: 'moral', points: -5, isPositive: false },
  { id: 'moral-11', name: '不讲礼貌', category: 'moral', points: -3, isPositive: false },
  { id: 'moral-12', name: '撒谎', category: 'moral', points: -5, isPositive: false },
  { id: 'moral-13', name: '讲脏话', category: 'moral', points: -5, isPositive: false },
]

export const categoryNames: Record<string, string> = {
  'study-habit': '学习习惯',
  'study-subject': '学习科目',
  life: '生活习惯',
  moral: '性格养成'
}

export type DepositTier = {
  name: string
  icon: string
  gradient: string  // Tailwind gradient classes for background
  textColor: string // Tailwind text color class
}

export function getDepositTier(totalDeposit: number): DepositTier {
  if (totalDeposit >= 10000) {
    return {
      name: '覚悟の人',
      icon: '💎',
      gradient: 'from-purple-500 via-amber-400 to-yellow-300',
      textColor: 'text-purple-600',
    }
  }
  if (totalDeposit >= 5000) {
    return {
      name: '本気組',
      icon: '🔥🔥🔥',
      gradient: 'from-red-500 via-rose-500 to-orange-400',
      textColor: 'text-red-500',
    }
  }
  if (totalDeposit >= 2000) {
    return {
      name: 'チャレンジャー',
      icon: '🔥🔥',
      gradient: 'from-orange-500 via-red-400 to-orange-400',
      textColor: 'text-orange-600',
    }
  }
  if (totalDeposit >= 1) {
    return {
      name: 'ルーキー',
      icon: '🔥',
      gradient: 'from-orange-400 to-amber-300',
      textColor: 'text-orange-500',
    }
  }
  return {
    name: '',
    icon: '',
    gradient: 'from-gray-200 to-gray-300',
    textColor: 'text-gray-400',
  }
}

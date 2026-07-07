export type RoleType = 'CASHIER' | 'WEIGHER' | 'WAREHOUSE' | 'BAR' | 'FLOOR_MANAGER' | 'MANAGER'
export type Shift = 'FIRST' | 'SECOND'

export const ROLE_LABELS: Record<RoleType, string> = {
  CASHIER: 'Касиер',
  WEIGHER: 'Везнар',
  WAREHOUSE: 'Складов работник',
  BAR: 'ОТЗ - Бар',
  FLOOR_MANAGER: 'Салонен управител',
  MANAGER: 'Управител',
}

export const SHIFT_LABELS: Record<Shift, string> = {
  FIRST: 'Първа смяна',
  SECOND: 'Втора смяна',
}

export const ROLE_COLORS: Record<RoleType, string> = {
  CASHIER: 'bg-blue-100 text-blue-800 border-blue-200',
  WEIGHER: 'bg-green-100 text-green-800 border-green-200',
  WAREHOUSE: 'bg-orange-100 text-orange-800 border-orange-200',
  BAR: 'bg-pink-100 text-pink-800 border-pink-200',
  FLOOR_MANAGER: 'bg-teal-100 text-teal-800 border-teal-200',
  MANAGER: 'bg-purple-100 text-purple-800 border-purple-200',
}

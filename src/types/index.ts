export interface Stock {
  id: string
  date: string
  ticker: string
  qty: number
  price: number
  currency: string
  trm: number
  priceCOP: number
  commission: number
  source?: string
  accountId?: string
  accountName?: string
}

export interface Crypto extends Omit<Stock, 'source'> {}

export interface Finance {
  id: string
  date: string
  type: 'ingreso' | 'egreso'
  category: string
  desc?: string
  amount: number
  accountId?: string
  accountName?: string
}

export interface HysMovement {
  id: string
  date: string
  type: string
  amount: number
  balance: number
  note?: string
  rate: number
}

export interface Hys {
  rate: number
  movements: HysMovement[]
}

export interface Cash {
  banco: number
  note?: string
}

export interface UserConfig {
  theme: "dark" | "light"
}

export interface BankAccount {
  id: string
  name: string
  bank?: string
  balance: number
  color?: string
}

export interface ActivityLog {
  id: string
  type: string
  description: string
  amount?: number
  ticker?: string
  accountName?: string
  createdAt: string
}

export interface AllData {
  stocks: Stock[]
  crypto: Crypto[]
  finances: Finance[]
  hys: Hys | null
  prices: Record<string, number>
  targets: Record<string, number>
  cash: Cash | null
  config: UserConfig | null
  bankAccounts: BankAccount[]
  activityLogs: ActivityLog[]
}

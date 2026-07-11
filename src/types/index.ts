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

export interface HysAccount {
  id: string
  name: string
  currency: string
  rate: number
  openedAt?: string
  movements: HysMovement[]
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
  onboardingDone: boolean
  showStocks: boolean
  showCrypto: boolean
  showHys: boolean
  showActivity: boolean
  showGoals: boolean
  baseCurrency: "COP" | "USD"
  trm: number | null
  trmUpdatedAt: string | null
  summaryWidgets: string[] | null
  telegramId?: string | null
}

export interface Goal {
  id: string
  name: string
  target: number
  saved: number
  deadline?: string
  color?: string
}

export interface Category {
  id: string
  name: string
  type: "ingreso" | "egreso"
}

export interface BankAccount {
  id: string
  name: string
  bank?: string
  type: string
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

export interface Budget {
  id: string
  category: string
  amount: number
  period: "semanal" | "mensual" | "anual"
}

export interface BudgetConfig {
  period: "semanal" | "mensual" | "anual"
  amount: number
}

export interface Recurring {
  id: string
  type: "ingreso" | "egreso"
  category: string
  desc: string
  amount: number
  accountId?: string
  accountName?: string
  frequency: "diario" | "semanal" | "quincenal" | "mensual" | "anual"
  nextDate: string
  active: boolean
}

export interface ShareInfo {
  id: string
  ownerId: string
  ownerName: string | null
  guestEmail: string
  guestId: string | null
  guestName: string | null
  role: "viewer" | "editor"
  status: "pending" | "accepted"
}

export interface AllData {
  stocks: Stock[]
  crypto: Crypto[]
  finances: Finance[]
  hys: Hys | null
  hysAccounts: HysAccount[]
  prices: Record<string, number>
  targets: Record<string, number>
  cash: Cash | null
  config: UserConfig | null
  bankAccounts: BankAccount[]
  activityLogs: ActivityLog[]
  budgets: Budget[]
  budgetConfigs: BudgetConfig[]
  categories: Category[]
  goals: Goal[]
  recurrings: Recurring[]
  sharesGiven: ShareInfo[]
  sharesReceived: ShareInfo[]
  viewingAs: { userId: string; name: string } | null
}

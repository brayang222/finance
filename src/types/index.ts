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
  saleId?: string | null
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
  showCommerce: boolean
  telegramId?: string | null
  salesGoal?: number | null
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

export interface FiadoMovement {
  id: string
  customerId: string
  date: string
  type: "fiado" | "abono"
  amount: number
  note?: string
  dueDate?: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  note?: string
  kind: "customer" | "supplier"
  movements: FiadoMovement[]
}

export interface Product {
  id: string
  name: string
  category?: string
  cost: number
  price: number
  stock: number
  minStock: number
  active: boolean
}

export interface SaleItem {
  id: string
  productId?: string
  name: string
  qty: number
  price: number
  cost: number
}

export interface Sale {
  id: string
  date: string
  total: number
  cost: number
  payMethod: string // "cash" | "fiado" | bankAccountId
  customerId?: string
  note?: string
  createdAt: string
  items: SaleItem[]
}

export interface CashClose {
  id: string
  date: string
  expectedCash: number
  countedCash: number
  diff: number
  note?: string
  summary: { byMethod: Record<string, number>; gastos: number; ventas: number } | null
}

export interface Transfer {
  id: string
  date: string
  fromAccountId: string
  fromAccountName?: string
  toAccountId: string
  toAccountName?: string
  amount: number
  note?: string
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
  profile: "personal" | "business"
  customers: Customer[]
  products: Product[]
  sales: Sale[]
  cashCloses: CashClose[]
  transfers: Transfer[]
}

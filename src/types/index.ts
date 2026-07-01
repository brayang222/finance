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
}

export interface Crypto extends Omit<Stock, 'source'> {}

export interface Finance {
  id: string
  date: string
  type: 'ingreso' | 'egreso'
  category: string
  desc?: string
  amount: number
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

export interface AllData {
  stocks: Stock[]
  crypto: Crypto[]
  finances: Finance[]
  hys: Hys | null
  prices: Record<string, number>
  targets: Record<string, number>
  cash: Cash | null
}

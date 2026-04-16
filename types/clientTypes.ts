export type ApiErrorResponse = {
  error: string
  message: string
}

export type ApiResponse<T> = {
  message: string
  data: T
}

export type Client = {
  id: string
  storeId: string
  name: string
  phone: string | null
  address: string
  creditLimit: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type DebtSummary = {
  totalSalesCount: number
  openSalesCount: number
  totalAmount: string
  amountPaid: string
  outstanding: string
}

export type ClientProfile = {
  client: Client
  debtSummary: DebtSummary
}

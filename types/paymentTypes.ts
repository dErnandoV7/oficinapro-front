export type PaymentClient = {
    id: string
    name: string
    phone?: string | null
}

export type PaymentSale = {
    id: string
    customName: string | null
    totalAmount: number
    client?: { id: string; name: string } | null
}

export type Payment = {
    id: string
    clientId: string | null
    saleId: string | null
    amount: number
    createdAt: string
    client: PaymentClient | null
    sale: PaymentSale | null
}

export type PaymentFormData = {
    saleId: string
    amount: number
}

export type ListPaymentsParams = {
    clientId?: string
    saleId?: string
    month?: number
    year?: number
    sortBy?: "createdAt" | "amount" | "client"
    order?: "asc" | "desc"
}

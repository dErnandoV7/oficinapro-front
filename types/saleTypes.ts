import type { ItemType } from "@/types/productTypes"

export type SaleItemDetail = {
    id: string
    saleId: string
    catalogItemId: string | null
    customDesc: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
    item: { id: string; name: string; type: ItemType } | null
}

export type SaleClient = {
    id: string
    name: string
    phone?: string | null
}

export type Sale = {
    id: string
    storeId: string
    clientId: string | null
    customName: string | null
    description: string | null
    totalAmount: number
    amountPaid: number
    isFullyPaid: boolean
    createdAt: string
    client: SaleClient | null
    _count?: { items: number }
    items?: SaleItemDetail[]
    payments?: unknown[]
}

export type SaleItemFormData = {
    catalogItemId?: string
    customDesc?: string
    quantity: number
    unitPrice: number
}

export type SaleFormData = {
    clientId?: string
    customName?: string
    description?: string
    items: SaleItemFormData[]
}

export type ListSalesParams = {
    clientId?: string
    paymentStatus?: "pendente" | "parcial" | "pago"
    sortBy?: "createdAt" | "totalAmount" | "status" | "customName" | "client"
    order?: "asc" | "desc"
}

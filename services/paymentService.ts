import api from "@/api/axios"
import type { ApiResponse } from "@/types/clientTypes"
import type { Payment, PaymentFormData, ListPaymentsParams } from "@/types/paymentTypes"

export const listPayments = async (params?: ListPaymentsParams) => {
    const res = await api.get<ApiResponse<Payment[]>>("/payments", { params })
    return res.data
}

export const createPayment = async (data: PaymentFormData) => {
    const res = await api.post<ApiResponse<Payment>>("/payments", data)
    return res.data
}

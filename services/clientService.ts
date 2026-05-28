import api from "@/api/axios"
import type { ApiResponse, Client, ClientProfile } from "@/types/clientTypes"

export type ListClientsParams = {
    q?: string
    isActive?: "true" | "false"
    sortBy?: "creditLimit"
    order?: "asc" | "desc"
}

type CreateClientInput = {
    name: string
    phone?: string
    address: string
    creditLimit?: number
}

type UpdateClientInput = {
    name?: string
    phone?: string
    address?: string
    creditLimit?: number
    isActive?: boolean
}

export const listClients = async (params?: ListClientsParams) => {
    const res = await api.get<ApiResponse<Client[]>>("/clients", { params })
    return res.data
}

export const getClientById = async (clientId: string) => {
    const res = await api.get<ApiResponse<Client>>(`/clients/${clientId}`)
    return res.data
}

export const getClientProfile = async (clientId: string) => {
    const res = await api.get<ApiResponse<ClientProfile>>(`/clients/${clientId}/profile`)
    return res.data
}

export const createClient = async (data: CreateClientInput) => {
    const payload = {
        name: data.name,
        address: data.address,
        ...(data.phone?.trim() ? { phone: data.phone } : {}),
        ...(typeof data.creditLimit === "number" ? { creditLimit: data.creditLimit } : {}),
    }

    const res = await api.post<ApiResponse<Client>>("/clients", payload)
    return res.data
}

export const updateClient = async (clientId: string, data: UpdateClientInput) => {
    const payload = {
        ...(typeof data.name === "string" ? { name: data.name } : {}),
        ...(typeof data.address === "string" ? { address: data.address } : {}),
        ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
        ...(typeof data.creditLimit === "number" ? { creditLimit: data.creditLimit } : {}),
        ...(typeof data.phone === "string" && data.phone.trim() ? { phone: data.phone } : {}),
    }

    const res = await api.patch<ApiResponse<Client>>(`/clients/${clientId}`, payload)
    return res.data
}

export const deleteClient = async (clientId: string) => {
    const res = await api.delete<ApiResponse<Client>>(`/clients/${clientId}`)
    return res.data
}

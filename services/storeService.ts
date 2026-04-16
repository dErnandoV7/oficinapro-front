import api from "@/api/axios"
import type { ApiResponse } from "@/types/clientTypes"

type Store = {
  id: string
  name: string
  adminId: string
  createdAt: string
}

type CreateStoreResponse = ApiResponse<{
  store: Store
  token: string
}>

export const createStore = async (data: { name: string }) => {
  const res = await api.post<CreateStoreResponse>("/admin/store", data)
  return res.data
}

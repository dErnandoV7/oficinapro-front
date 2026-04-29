import api from "@/api/axios"
import { ApiResponse } from "@/types/clientTypes"
import { Product, ProductFormData } from "@/types/productTypes"

export const listProducts = async (search?: string, order?: "asc" | "desc") => {
    const res = await api.get<ApiResponse<Product[]>>("/products", {
        params: { search, order },
    })
    return res.data
}

export const createProduct = async (data: ProductFormData) => {
    const res = await api.post<ApiResponse<Product>>("/products", data)
    return res.data
}

export const updateProduct = async (id: string, data: Partial<ProductFormData>) => {
    const res = await api.patch<ApiResponse<Product>>(`/products/${id}`, data)
    return res.data
}

export const deleteProduct = async (id: string) => {
    const res = await api.delete<ApiResponse<Product>>(`/products/${id}`)
    return res.data
}

export const getProduct = async (id: string) => {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`)
    return res.data
}

import api from "@/api/axios"
import type { CreateUserType, LoginUserType } from "@/types/userTypes"

export const createUser = async (data: CreateUserType) => {
    const res = await api.post("/admin", data)

    return res.data
}

export const loginUser = async (data: LoginUserType) => {
    const res = await api.post("/admin/login", data)

    return res.data
}
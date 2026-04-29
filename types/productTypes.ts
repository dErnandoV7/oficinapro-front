export type Product = {
    id: string,
    name: string,
    type: ItemType,
    category: string,
    description: string,
    costPrice: number,
    sellPrice: number,
    stock: number,
    minStock: number,
    isActive: boolean,
}

export type ItemType = "PRODUCT" | "SERVICE"

export type ProductFormData = {
    type: ItemType,
    name: string,
    description?: string,
    category?: string,
    costPrice: number,
    sellPrice: number,
    stock: number,
    minStock: number
}
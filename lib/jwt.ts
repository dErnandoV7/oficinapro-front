type JwtPayload = {
  storeId?: unknown
  store?: unknown
  [key: string]: unknown
}

const base64UrlToBase64 = (input: string) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = normalized.length % 4
  return pad ? normalized + "=".repeat(4 - pad) : normalized
}

const decodeBase64 = (input: string) => {
  if (typeof atob === "function") return atob(input)
  return Buffer.from(input, "base64").toString("binary")
}

export const parseJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const json = decodeBase64(base64UrlToBase64(parts[1]))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export const tokenHasStore = (token: string): boolean => {
  const payload = parseJwtPayload(token)
  if (!payload) return false

  const storeId = payload.storeId
  if (typeof storeId === "string" && storeId.trim()) return true

  const store = payload.store
  if (typeof store === "string" && store.trim()) return true
  if (typeof store === "object" && store && "id" in store) {
    const id = (store as { id?: unknown }).id
    if (typeof id === "string" && id.trim()) return true
  }

  return false
}

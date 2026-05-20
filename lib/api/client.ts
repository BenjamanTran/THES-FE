const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "")

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: customHeaders, body, ...rest } = options || {}
  const headers: Record<string, string> = { ...(customHeaders as Record<string, string>) }
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData
  if (body !== undefined && body !== null && !isFormData) {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    ...(body !== undefined ? { body } : {}),
    headers,
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => null)
    const message = errBody?.errors?.join(", ") || errBody?.error || `API error: ${res.status}`
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

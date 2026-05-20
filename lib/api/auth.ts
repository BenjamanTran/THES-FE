import { request } from "./client"
import type { AuthResponse, AuthUser, UpdateProfileParams } from "./types"

export function mergeAuthUser(res: AuthResponse): AuthUser {
  return { ...res.user, stats: res.stats }
}

export function signup(params: {
  email: string
  name: string
  password: string
  password_confirmation: string
}) {
  return request<AuthResponse>("/api/v1/signup", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function login(params: { email: string; password: string }) {
  return request<AuthResponse>("/api/v1/login", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function logout() {
  return request<{ status: "signed_out" }>("/api/v1/logout", { method: "DELETE" })
}

export function fetchMe() {
  return request<AuthResponse>("/api/v1/me")
}

export function updateProfile(params: UpdateProfileParams) {
  return request<AuthResponse>("/api/v1/me", {
    method: "PATCH",
    body: JSON.stringify(params),
  })
}

export function upgradeGuest(params: {
  email: string
  password: string
  password_confirmation: string
}) {
  return request<AuthResponse>("/api/v1/me", {
    method: "PATCH",
    body: JSON.stringify(params),
  })
}

export function forgotPassword(email: string) {
  return request<{ message: string }>("/api/v1/passwords/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(params: {
  token: string
  password: string
  password_confirmation: string
}) {
  return request<AuthResponse & { message: string }>("/api/v1/passwords/reset", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

export function verifyEmail(token: string) {
  return request<AuthResponse & { message: string }>("/api/v1/email_verifications/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

export function resendVerificationEmail() {
  return request<{ message: string }>("/api/v1/email_verifications/resend", {
    method: "POST",
  })
}

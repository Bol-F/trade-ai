"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, type ReactNode } from "react"
import { authApi, type User } from "@/lib/api"

type AuthState = {
  user: User | null
  isLoading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["current-user"],
    queryFn: authApi.me,
    retry: false,
  })
  return (
    <AuthContext.Provider
      value={{
        user: query.data ?? null,
        isLoading: query.isLoading,
        refresh: async () => {
          await queryClient.invalidateQueries({ queryKey: ["current-user"] })
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used within AuthProvider")
  return value
}

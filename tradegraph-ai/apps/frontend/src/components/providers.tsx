"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import { AuthProvider } from "@/components/auth-provider"
import { defaultQueryOptions } from "@/lib/query-options"
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        ...defaultQueryOptions,
      },
    },
  }))
  return <ThemeProvider attribute="class" defaultTheme="system" enableSystem><QueryClientProvider client={queryClient}><AuthProvider>{children}</AuthProvider></QueryClientProvider></ThemeProvider>
}

"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import { AuthProvider } from "@/components/auth-provider"
import { I18nProvider } from "@/lib/i18n"
import { defaultQueryOptions } from "@/lib/query-options"
import { ToastProvider } from "@/components/ui/toast"
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        ...defaultQueryOptions,
      },
    },
  }))
  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem><I18nProvider><QueryClientProvider client={queryClient}><AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider></QueryClientProvider></I18nProvider></ThemeProvider>
}

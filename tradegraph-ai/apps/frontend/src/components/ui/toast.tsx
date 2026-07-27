"use client"

import * as React from "react"
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastTone = "info" | "success" | "warning" | "destructive"
type ToastMessage = { id: number; title: string; description?: string; tone: ToastTone }
type ToastInput = Omit<ToastMessage, "id">
type ToastContextValue = { toast: (message: ToastInput) => number; dismiss: (id: number) => void }

const ToastContext = React.createContext<ToastContextValue | null>(null)
const toneStyles: Record<ToastTone, string> = {
  info: "border-info/30 bg-popover [&_[data-icon]]:text-info",
  success: "border-success/30 bg-popover [&_[data-icon]]:text-success",
  warning: "border-warning/30 bg-popover [&_[data-icon]]:text-warning",
  destructive: "border-destructive/30 bg-popover [&_[data-icon]]:text-destructive",
}
const toneIcons = { info: Info, success: CheckCircle2, warning: TriangleAlert, destructive: XCircle }

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([])
  const nextId = React.useRef(0)
  const dismiss = React.useCallback((id: number) => setMessages(current => current.filter(message => message.id !== id)), [])
  const toast = React.useCallback((message: ToastInput) => {
    const id = ++nextId.current
    setMessages(current => [...current, { ...message, id }])
    window.setTimeout(() => dismiss(id), 5000)
    return id
  }, [dismiss])
  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-4 bottom-4 z-[var(--z-toast)] flex flex-col items-end gap-3 sm:left-auto sm:w-[24rem]">
        {messages.map(message => {
          const Icon = toneIcons[message.tone]
          return (
            <div key={message.id} role="status" className={cn("pointer-events-auto grid w-full grid-cols-[auto_1fr_auto] gap-3 rounded-xl border p-4 text-popover-foreground shadow-elevated", toneStyles[message.tone])}>
              <Icon data-icon aria-hidden="true" className="mt-0.5 size-5" />
              <div><p className="text-sm font-medium">{message.title}</p>{message.description && <p className="mt-1 text-sm text-muted-foreground">{message.description}</p>}</div>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(message.id)} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export { ToastProvider, useToast, type ToastInput, type ToastTone }

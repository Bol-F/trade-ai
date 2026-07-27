import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 hover:border-border-strong focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20", className)} {...props} />
}
export { Input }

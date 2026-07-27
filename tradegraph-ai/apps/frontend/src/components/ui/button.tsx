"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
const buttonVariants = cva("inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0", { variants: {
  variant: { default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover", outline: "border border-border-strong bg-background hover:border-primary/50 hover:bg-accent", ghost: "hover:bg-accent hover:text-accent-foreground", destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90", success: "bg-success text-white hover:bg-success/90" },
  size: { default: "h-10 px-4 py-2", sm: "min-h-9 px-3", lg: "h-11 px-6", icon: "size-10 p-0" },
}, defaultVariants: { variant: "default", size: "default" } })
function Button({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} aria-busy={loading || undefined} disabled={!asChild ? disabled || loading : undefined} {...props}>
    {loading && <LoaderCircle aria-hidden="true" className="animate-spin" />}
    {children}
  </Comp>
}
export { Button, buttonVariants }

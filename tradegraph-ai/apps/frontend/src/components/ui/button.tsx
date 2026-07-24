"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4", { variants: {
  variant: { default: "bg-primary text-primary-foreground hover:opacity-90", outline: "border bg-background hover:bg-accent", ghost: "hover:bg-accent", destructive: "bg-destructive text-white" },
  size: { default: "h-9 px-4 py-2", sm: "h-8 px-3", lg: "h-11 px-6", icon: "size-9" },
}, defaultVariants: { variant: "default", size: "default" } })
function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
export { Button, buttonVariants }

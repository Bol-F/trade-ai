import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 rounded-xl border p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-4",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/30 bg-info-surface text-foreground [&>svg]:text-info",
        success: "border-success/30 bg-success-surface text-foreground [&>svg]:text-success",
        warning: "border-warning/30 bg-warning-surface text-foreground [&>svg]:text-warning",
        destructive: "border-destructive/30 bg-danger-surface text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="alert-title" className={cn("col-start-2 font-medium leading-5", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("col-start-2 mt-1 text-muted-foreground", className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, alertVariants }

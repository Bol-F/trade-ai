import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="Pagination" className={cn("flex w-full items-center justify-between gap-4", className)} {...props} />
}

function PaginationStatus({ page, totalPages }: { page: number; totalPages: number }) {
  return <p className="text-sm text-muted-foreground" aria-live="polite">Page <span className="font-mono text-foreground">{page}</span> of <span className="font-mono text-foreground">{totalPages}</span></p>
}

function PaginationPrevious({ children = "Previous", ...props }: React.ComponentProps<typeof Button>) {
  return <Button variant="outline" size="sm" {...props}><ChevronLeft aria-hidden="true" />{children}</Button>
}

function PaginationNext({ children = "Next", ...props }: React.ComponentProps<typeof Button>) {
  return <Button variant="outline" size="sm" {...props}>{children}<ChevronRight aria-hidden="true" /></Button>
}

export { Pagination, PaginationStatus, PaginationPrevious, PaginationNext }

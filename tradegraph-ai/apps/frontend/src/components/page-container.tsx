import { cn } from "@/lib/utils"
export function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 md:px-8", className)} {...props} />
}

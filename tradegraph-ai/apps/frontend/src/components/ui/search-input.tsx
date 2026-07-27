import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchInputProps = React.ComponentProps<typeof Input> & {
  onClear?: () => void
  clearLabel?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, clearLabel = "Clear search", value, ...props }, ref) => (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input ref={ref} type="search" value={value} className={cn("pl-9", onClear && value ? "pr-10" : "", className)} {...props} />
      {onClear && value ? (
        <button type="button" onClick={onClear} aria-label={clearLabel} className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  ),
)
SearchInput.displayName = "SearchInput"

export { SearchInput }

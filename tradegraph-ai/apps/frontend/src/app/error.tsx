"use client"
import { Button } from "@/components/ui/button"
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-xl px-6 py-24 text-center"><h2 className="text-2xl font-semibold">Something went wrong</h2><p className="mt-3 text-muted-foreground">The page could not be loaded.</p><Button className="mt-6" onClick={reset}>Try again</Button></div>
}

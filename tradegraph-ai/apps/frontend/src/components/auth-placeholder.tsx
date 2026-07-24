import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
export function AuthPlaceholder({ mode }: { mode: "login" | "register" }) {
  const login = mode === "login"
  return <PageContainer className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12"><div className="w-full max-w-md rounded-xl border bg-card p-8">
    <p className="font-mono text-xs uppercase tracking-widest text-primary">Foundation preview</p>
    <h1 className="mt-3 text-3xl font-semibold">{login ? "Welcome back" : "Create an account"}</h1>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">Authentication is intentionally not active in this milestone.</p>
    <Button className="mt-8 w-full" disabled>{login ? "Log in" : "Register"} — coming soon</Button>
    <p className="mt-6 text-center text-sm text-muted-foreground">{login ? "New here?" : "Already registered?"} <Link className="text-foreground underline" href={login ? "/register" : "/login"}>{login ? "Register" : "Log in"}</Link></p>
  </div></PageContainer>
}

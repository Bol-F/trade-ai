"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { ApiError, authApi } from "@/lib/api"

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  first_name: z.string().max(150),
  last_name: z.string().max(150),
})
type AuthValues = z.infer<typeof authSchema>

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login"
  const router = useRouter()
  const { refresh } = useAuth()
  const schema = authSchema.superRefine((values, context) => {
    if (!isLogin && values.first_name.length === 0) context.addIssue({ code: "custom", path: ["first_name"], message: "First name is required." })
    if (!isLogin && values.last_name.length === 0) context.addIssue({ code: "custom", path: ["last_name"], message: "Last name is required." })
    if (!isLogin && values.password.length < 10) context.addIssue({ code: "custom", path: ["password"], message: "Use at least 10 characters." })
  })
  const form = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", first_name: "", last_name: "" },
  })

  async function submit(values: AuthValues) {
    form.clearErrors("root")
    try {
      if (isLogin) await authApi.login({ email: values.email, password: values.password })
      else await authApi.register(values)
      await refresh()
      router.push("/countries")
    } catch (error) {
      form.setError("root", { message: error instanceof ApiError ? error.message : "Unable to complete the request." })
    }
  }

  return (
    <PageContainer className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Secure account</p>
        <h1 className="mt-3 text-3xl font-semibold">{isLogin ? "Welcome back" : "Create an account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your session is kept in secure browser cookies.</p>
        <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
          {!isLogin && <div className="grid gap-4 sm:grid-cols-2">
            <Field id="first-name" label="First name" error={form.formState.errors.first_name?.message}><Input id="first-name" autoComplete="given-name" {...form.register("first_name")} /></Field>
            <Field id="last-name" label="Last name" error={form.formState.errors.last_name?.message}><Input id="last-name" autoComplete="family-name" {...form.register("last_name")} /></Field>
          </div>}
          <Field id="email" label="Email" error={form.formState.errors.email?.message}><Input id="email" type="email" autoComplete="email" {...form.register("email")} /></Field>
          <Field id="password" label="Password" error={form.formState.errors.password?.message}><Input id="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} {...form.register("password")} /></Field>
          {form.formState.errors.root?.message && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{form.formState.errors.root.message}</p>}
          <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Please wait…" : isLogin ? "Log in" : "Register"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">{isLogin ? "New here?" : "Already registered?"} <Link className="text-foreground underline" href={isLogin ? "/register" : "/login"}>{isLogin ? "Register" : "Log in"}</Link></p>
      </div>
    </PageContainer>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>
}

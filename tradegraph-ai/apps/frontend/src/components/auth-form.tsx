"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useAuth } from "@/components/auth-provider"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, authApi } from "@/lib/api"
import { useI18n } from "@/lib/i18n"

type AuthValues = {
  email: string
  password: string
  first_name: string
  last_name: string
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login"
  const router = useRouter()
  const { refresh } = useAuth()
  const { t } = useI18n()
  const schema = z
    .object({
      email: z.string().email(t("auth.validEmail")),
      password: z.string().min(1, t("auth.passwordRequired")),
      first_name: z.string().max(150),
      last_name: z.string().max(150),
    })
    .superRefine((values, context) => {
      if (!isLogin && values.first_name.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["first_name"],
          message: t("auth.firstNameRequired"),
        })
      }
      if (!isLogin && values.last_name.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["last_name"],
          message: t("auth.lastNameRequired"),
        })
      }
      if (!isLogin && values.password.length < 10) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: t("auth.passwordLength"),
        })
      }
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
      form.setError("root", {
        message: error instanceof ApiError ? error.message : t("auth.requestFailed"),
      })
    }
  }

  return (
    <PageContainer className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          {t("auth.secureAccount")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          {isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.sessionHelp")}</p>
        <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
          {!isLogin && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="first-name"
                label={t("auth.firstName")}
                error={form.formState.errors.first_name?.message}
              >
                <Input
                  id="first-name"
                  autoComplete="given-name"
                  {...form.register("first_name")}
                />
              </Field>
              <Field
                id="last-name"
                label={t("auth.lastName")}
                error={form.formState.errors.last_name?.message}
              >
                <Input
                  id="last-name"
                  autoComplete="family-name"
                  {...form.register("last_name")}
                />
              </Field>
            </div>
          )}
          <Field id="email" label={t("auth.email")} error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          <Field
            id="password"
            label={t("auth.password")}
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              {...form.register("password")}
            />
          </Field>
          {form.formState.errors.root?.message && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {form.formState.errors.root.message}
            </p>
          )}
          <Button className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? t("auth.wait")
              : isLogin
                ? t("auth.login")
                : t("auth.register")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? t("auth.newHere") : t("auth.alreadyRegistered")}{" "}
          <Link
            className="text-foreground underline"
            href={isLogin ? "/register" : "/login"}
          >
            {isLogin ? t("auth.register") : t("auth.login")}
          </Link>
        </p>
      </div>
    </PageContainer>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useI18n()
  const dark = resolvedTheme === "dark"
  return <Button variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={t("theme.toggle")}>{dark ? <Sun /> : <Moon />}</Button>
}

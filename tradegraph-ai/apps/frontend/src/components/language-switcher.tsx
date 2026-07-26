"use client"

import { Languages } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const nextLocale = locale === "en" ? "ru" : "en"

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(nextLocale)}
      aria-label={`${t("language.label")}: ${locale === "en" ? t("language.english") : t("language.russian")}`}
      title={t("language.label")}
      className="gap-1.5 px-2"
    >
      <Languages className="size-4" />
      <span className="font-mono text-xs uppercase">{locale}</span>
    </Button>
  )
}

"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

export type Locale = "en" | "ru"

const messages = {
  en: {
    "language.label": "Language",
    "language.english": "English",
    "language.russian": "Russian",
  },
  ru: {
    "language.label": "Язык",
    "language.english": "Английский",
    "language.russian": "Русский",
  },
} as const

export type TranslationKey = keyof (typeof messages)["en"]

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = "tradegraph-locale"

function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "ru"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ locale: Locale; hydrated: boolean }>({
    locale: "en",
    hydrated: false,
  })
  const userSelectedLocale = useRef(false)
  const setLocale = useCallback((locale: Locale) => {
    userSelectedLocale.current = true
    setState({ locale, hydrated: true })
  }, [])

  useEffect(() => {
    let cancelled = false
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const preferred = isLocale(saved)
      ? saved
      : navigator.language.toLowerCase().startsWith("ru")
        ? "ru"
        : "en"
    queueMicrotask(() => {
      if (!cancelled && !userSelectedLocale.current) {
        setState({ locale: preferred, hydrated: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    window.localStorage.setItem(STORAGE_KEY, state.locale)
    document.documentElement.lang = state.locale
  }, [state])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: state.locale,
      setLocale,
      t: (key, values) => {
        let translated: string = messages[state.locale][key]
        for (const [name, replacement] of Object.entries(values ?? {})) {
          translated = translated.replaceAll(`{${name}}`, String(replacement))
        }
        return translated
      },
    }),
    [setLocale, state.locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used within I18nProvider")
  return context
}

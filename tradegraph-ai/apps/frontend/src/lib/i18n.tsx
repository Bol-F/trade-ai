"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

export type Locale = "en" | "ru"

const messages = {
  en: {
    "language.label": "Language",
    "language.english": "English",
    "language.russian": "Russian",
    "nav.primary": "Primary navigation",
    "nav.mobile": "Mobile navigation",
    "nav.open": "Open navigation",
    "nav.overview": "Overview",
    "nav.explorer": "Explorer",
    "nav.map": "Map",
    "nav.countries": "Countries",
    "nav.products": "Products",
    "nav.anomalies": "Anomalies",
    "nav.forecast": "Forecast",
    "nav.suppliers": "Supplier Finder",
    "nav.compare": "Compare",
    "nav.methodology": "Methodology",
    "nav.dataSources": "Data Sources",
    "nav.glossary": "Glossary",
    "nav.workspace": "Workspace",
    "nav.administration": "Administration",
    "nav.dataHealth": "Data health",
    "auth.login": "Log in",
    "auth.logout": "Log out",
    "auth.getStarted": "Get started",
    "auth.register": "Register",
    "auth.secureAccount": "Secure account",
    "auth.welcomeBack": "Welcome back",
    "auth.createAccount": "Create an account",
    "auth.sessionHelp": "Your session is kept in secure browser cookies.",
    "auth.firstName": "First name",
    "auth.lastName": "Last name",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.wait": "Please wait…",
    "auth.newHere": "New here?",
    "auth.alreadyRegistered": "Already registered?",
    "auth.validEmail": "Enter a valid email address.",
    "auth.passwordRequired": "Password is required.",
    "auth.firstNameRequired": "First name is required.",
    "auth.lastNameRequired": "Last name is required.",
    "auth.passwordLength": "Use at least 10 characters.",
    "auth.requestFailed": "Unable to complete the request.",
    "theme.toggle": "Toggle theme",
    "overview.eyebrow": "International trade analysis",
    "overview.title": "Understand who trades what, with whom, and how that changes.",
    "overview.description": "TradeGraph AI turns country-to-country merchandise trade records into searchable flows, concentration measures, anomaly signals, forecasts, and explainable supplier comparisons.",
    "overview.openExplorer": "Open Explorer",
    "overview.example": "Explore Uzbekistan’s wheat suppliers",
    "overview.loadError": "The active data source and catalog counts could not be loaded. Check that the API is available.",
    "overview.coverage": "Active data coverage",
    "overview.coverageHelp": "Live catalog and dataset metadata, not fabricated statistics.",
    "overview.countries": "Countries and economies",
    "overview.products": "Product categories",
    "overview.coverageThrough": "Coverage through",
    "overview.activeSource": "Active source",
    "overview.questions": "Questions you can investigate",
    "overview.question1": "How has a product’s trade changed over time?",
    "overview.question2": "Which suppliers dominate an importer’s demand?",
    "overview.question3": "Which flows departed from their historical pattern?",
    "overview.question4": "Which alternative suppliers meet transparent ranking rules?",
    "overview.decisionTitle": "Decision support, not certainty",
    "overview.decisionText": "Forecasts are statistical estimates based on historical project data. Exposure scores summarize trade-supply structure; they are not complete political, logistics, security, or financial risk scores.",
    "overview.reviewMethodology": "Review methodology",
  },
  ru: {
    "language.label": "Язык",
    "language.english": "Английский",
    "language.russian": "Русский",
    "nav.primary": "Основная навигация",
    "nav.mobile": "Мобильная навигация",
    "nav.open": "Открыть навигацию",
    "nav.overview": "Обзор",
    "nav.explorer": "Анализ торговли",
    "nav.map": "Карта",
    "nav.countries": "Страны",
    "nav.products": "Товары",
    "nav.anomalies": "Аномалии",
    "nav.forecast": "Прогноз",
    "nav.suppliers": "Поиск поставщиков",
    "nav.compare": "Сравнение",
    "nav.methodology": "Методология",
    "nav.dataSources": "Источники данных",
    "nav.glossary": "Глоссарий",
    "nav.workspace": "Рабочая область",
    "nav.administration": "Администрирование",
    "nav.dataHealth": "Состояние данных",
    "auth.login": "Войти",
    "auth.logout": "Выйти",
    "auth.getStarted": "Начать",
    "auth.register": "Регистрация",
    "auth.secureAccount": "Защищённая учётная запись",
    "auth.welcomeBack": "С возвращением",
    "auth.createAccount": "Создать учётную запись",
    "auth.sessionHelp": "Сеанс хранится в защищённых cookie браузера.",
    "auth.firstName": "Имя",
    "auth.lastName": "Фамилия",
    "auth.email": "Электронная почта",
    "auth.password": "Пароль",
    "auth.wait": "Подождите…",
    "auth.newHere": "Впервые здесь?",
    "auth.alreadyRegistered": "Уже зарегистрированы?",
    "auth.validEmail": "Введите корректный адрес электронной почты.",
    "auth.passwordRequired": "Введите пароль.",
    "auth.firstNameRequired": "Введите имя.",
    "auth.lastNameRequired": "Введите фамилию.",
    "auth.passwordLength": "Используйте не менее 10 символов.",
    "auth.requestFailed": "Не удалось выполнить запрос.",
    "theme.toggle": "Переключить тему",
    "overview.eyebrow": "Анализ международной торговли",
    "overview.title": "Узнайте, кто, чем и с кем торгует и как это меняется.",
    "overview.description": "TradeGraph AI преобразует данные о торговле товарами между странами в потоки, показатели концентрации, сигналы аномалий, прогнозы и объяснимые сравнения поставщиков.",
    "overview.openExplorer": "Открыть анализ",
    "overview.example": "Поставщики пшеницы для Узбекистана",
    "overview.loadError": "Не удалось загрузить активный источник данных и каталоги. Проверьте доступность API.",
    "overview.coverage": "Покрытие активных данных",
    "overview.coverageHelp": "Актуальные метаданные каталога и набора данных, а не вымышленные показатели.",
    "overview.countries": "Страны и экономики",
    "overview.products": "Категории товаров",
    "overview.coverageThrough": "Данные по",
    "overview.activeSource": "Активный источник",
    "overview.questions": "Что можно исследовать",
    "overview.question1": "Как менялась торговля товаром со временем?",
    "overview.question2": "Какие поставщики преобладают в импорте страны?",
    "overview.question3": "Какие потоки отклонились от исторической динамики?",
    "overview.question4": "Какие альтернативные поставщики соответствуют прозрачным правилам?",
    "overview.decisionTitle": "Поддержка решений, а не гарантия",
    "overview.decisionText": "Прогнозы являются статистическими оценками на основе исторических данных проекта. Показатели подверженности отражают структуру поставок, но не являются полной оценкой политических, логистических, финансовых рисков или рисков безопасности.",
    "overview.reviewMethodology": "Изучить методологию",
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

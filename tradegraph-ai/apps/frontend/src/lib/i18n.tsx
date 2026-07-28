"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getBrowserLocale,
  persistBrowserLocale,
  type Locale,
} from "@/lib/locale";

export type { Locale } from "@/lib/locale";

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
    "nav.more": "More",
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
    "overview.title":
      "Understand who trades what, with whom, and how that changes.",
    "overview.description":
      "TradeGraph AI turns country-to-country merchandise trade records into searchable flows, concentration measures, anomaly signals, forecasts, and explainable supplier comparisons.",
    "overview.openExplorer": "Open Explorer",
    "overview.example": "Explore Uzbekistan’s wheat suppliers",
    "overview.loadError":
      "The active data source and catalog counts could not be loaded. Check that the API is available.",
    "overview.coverage": "Active data coverage",
    "overview.coverageHelp":
      "Live catalog and dataset metadata, not fabricated statistics.",
    "overview.countries": "Countries and economies",
    "overview.products": "Product categories",
    "overview.coverageThrough": "Coverage through",
    "overview.activeSource": "Active source",
    "overview.questions": "Questions you can investigate",
    "overview.question1": "How has a product’s trade changed over time?",
    "overview.question2": "Which suppliers dominate an importer’s demand?",
    "overview.question3": "Which flows departed from their historical pattern?",
    "overview.question4":
      "Which alternative suppliers meet transparent ranking rules?",
    "overview.decisionTitle": "Decision support, not certainty",
    "overview.decisionText":
      "Forecasts are statistical estimates based on historical project data. Exposure scores summarize trade-supply structure; they are not complete political, logistics, security, or financial risk scores.",
    "overview.reviewMethodology": "Review methodology",
    "common.overview": "Overview",
    "common.loading": "Loading…",
    "common.apply": "Apply filters",
    "common.reset": "Reset",
    "common.unavailable": "Unavailable",
    "explorer.eyebrow": "Core analysis workspace",
    "explorer.title": "Trade Explorer",
    "explorer.description":
      "Filter directed trade flows, review annual change, and compare partner and product composition without losing your selection.",
    "explorer.save": "Save analysis",
    "explorer.saving": "Saving…",
    "explorer.saved": "Analysis saved",
    "explorer.importer": "Importer",
    "explorer.exporter": "Exporter",
    "explorer.allImporters": "All importers",
    "explorer.allExporters": "All exporters",
    "explorer.product": "HS product code",
    "explorer.startYear": "Start year",
    "explorer.endYear": "End year",
    "explorer.error":
      "Explorer data is unavailable. Confirm that the API is online and an active dataset has been imported.",
    "explorer.tradeValue": "Trade value",
    "explorer.quantity": "Reported quantity",
    "explorer.quantityDetail": "Missing quantities remain excluded",
    "explorer.relationships": "Trade relationships",
    "explorer.yoy": "Latest YoY change",
    "explorer.annualTitle": "Annual trade value",
    "explorer.annualDescription": "USD, current filtered selection",
    "explorer.quantityTrend": "Annual reported quantity",
    "explorer.quantityDescription": "Metric tons, current filtered selection",
    "explorer.metric": "Chart metric",
    "explorer.interactiveHint":
      "Hover for exact values. Drag or scroll the timeline to zoom.",
    "explorer.observations": "{count} annual observations are shown.",
    "explorer.adjust": "Adjust or clear filters to find reported trade flows.",
    "explorer.topPartners": "Top partners",
    "explorer.topPartnersCaption":
      "Highest-value partners for the selected direction and period",
    "explorer.topProducts": "Top products",
    "explorer.topProductsCaption":
      "Highest-value HS6 products for the selected flows",
    "explorer.name": "Name",
    "explorer.howToRead": "How to read this analysis",
    "explorer.methodNote":
      "Values are aggregated from the active dataset after applying every visible filter. Missing quantities are not treated as zero. Year-over-year change is unavailable when the previous value is missing or zero.",
    "forecast.eyebrow": "Statistical decision support",
    "forecast.title": "Trade forecast",
    "forecast.description":
      "Compare historical observations, the retained moving-average baseline, and the active project-trained model. Forecasts are estimates, not guaranteed future values.",
    "forecast.definition": "Forecast definition",
    "forecast.importer": "Importer ISO3",
    "forecast.exporter": "Exporter ISO3",
    "forecast.product": "HS2 product",
    "forecast.year": "Forecast year",
    "forecast.run": "Run forecast",
    "forecast.calculating": "Calculating…",
    "forecast.errorTitle": "Forecast unavailable",
    "forecast.error":
      "The selected lane may have insufficient history, or the active model artifact may be unavailable. Try another lane or review data health.",
    "forecast.model": "Active-model forecast",
    "forecast.baseline": "Naive baseline",
    "forecast.difference": "Model difference",
    "forecast.estimate": "{year} estimate",
    "forecast.baselineDetail": "Three-year moving average when available",
    "supplier.eyebrow": "Explainable sourcing analysis",
    "supplier.title": "Supplier Finder",
    "supplier.description":
      "Rank potential exporters using transparent capacity, growth, stability, relationship, unit-value, and diversification components—not one unexplained score.",
    "supplier.question": "Sourcing question",
    "supplier.importer": "Importing country",
    "supplier.product": "HS2 product",
    "supplier.year": "Reference year",
    "supplier.find": "Find suppliers",
    "supplier.ranking": "Ranking…",
    "supplier.error":
      "Candidates could not be ranked. Verify the importer, product, and active data coverage.",
    "supplier.empty":
      "No exporters meet the positive-trade and minimum-history rules.",
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
    "nav.more": "Ещё",
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
    "overview.description":
      "TradeGraph AI преобразует данные о торговле товарами между странами в потоки, показатели концентрации, сигналы аномалий, прогнозы и объяснимые сравнения поставщиков.",
    "overview.openExplorer": "Открыть анализ",
    "overview.example": "Поставщики пшеницы для Узбекистана",
    "overview.loadError":
      "Не удалось загрузить активный источник данных и каталоги. Проверьте доступность API.",
    "overview.coverage": "Покрытие активных данных",
    "overview.coverageHelp":
      "Актуальные метаданные каталога и набора данных, а не вымышленные показатели.",
    "overview.countries": "Страны и экономики",
    "overview.products": "Категории товаров",
    "overview.coverageThrough": "Данные по",
    "overview.activeSource": "Активный источник",
    "overview.questions": "Что можно исследовать",
    "overview.question1": "Как менялась торговля товаром со временем?",
    "overview.question2": "Какие поставщики преобладают в импорте страны?",
    "overview.question3": "Какие потоки отклонились от исторической динамики?",
    "overview.question4":
      "Какие альтернативные поставщики соответствуют прозрачным правилам?",
    "overview.decisionTitle": "Поддержка решений, а не гарантия",
    "overview.decisionText":
      "Прогнозы являются статистическими оценками на основе исторических данных проекта. Показатели подверженности отражают структуру поставок, но не являются полной оценкой политических, логистических, финансовых рисков или рисков безопасности.",
    "overview.reviewMethodology": "Изучить методологию",
    "common.overview": "Обзор",
    "common.loading": "Загрузка…",
    "common.apply": "Применить фильтры",
    "common.reset": "Сбросить",
    "common.unavailable": "Недоступно",
    "explorer.eyebrow": "Основная рабочая область анализа",
    "explorer.title": "Анализ торговли",
    "explorer.description":
      "Фильтруйте направленные торговые потоки, изучайте годовые изменения и сравнивайте структуру партнёров и товаров без потери выбранных параметров.",
    "explorer.save": "Сохранить анализ",
    "explorer.saving": "Сохранение…",
    "explorer.saved": "Анализ сохранён",
    "explorer.importer": "Импортёр",
    "explorer.exporter": "Экспортёр",
    "explorer.allImporters": "Все импортёры",
    "explorer.allExporters": "Все экспортёры",
    "explorer.product": "Код товара HS",
    "explorer.startYear": "Начальный год",
    "explorer.endYear": "Конечный год",
    "explorer.error":
      "Данные анализа недоступны. Убедитесь, что API работает и активный набор данных импортирован.",
    "explorer.tradeValue": "Стоимость торговли",
    "explorer.quantity": "Заявленный объём",
    "explorer.quantityDetail": "Отсутствующие объёмы не учитываются",
    "explorer.relationships": "Торговые связи",
    "explorer.yoy": "Последнее изменение год к году",
    "explorer.annualTitle": "Годовая стоимость торговли",
    "explorer.annualDescription": "USD, текущая выборка",
    "explorer.quantityTrend": "Годовой заявленный объём",
    "explorer.quantityDescription": "Метрические тонны, текущая выборка",
    "explorer.metric": "Показатель графика",
    "explorer.interactiveHint":
      "Наведите для точных значений. Перетаскивайте или прокручивайте шкалу времени для масштабирования.",
    "explorer.observations": "Показано годовых наблюдений: {count}.",
    "explorer.adjust":
      "Измените или очистите фильтры, чтобы найти торговые потоки.",
    "explorer.topPartners": "Ведущие партнёры",
    "explorer.topPartnersCaption":
      "Партнёры с наибольшей стоимостью за выбранный период",
    "explorer.topProducts": "Ведущие товары",
    "explorer.topProductsCaption":
      "Товары HS6 с наибольшей стоимостью в выбранных потоках",
    "explorer.name": "Название",
    "explorer.howToRead": "Как читать этот анализ",
    "explorer.methodNote":
      "Значения агрегируются из активного набора данных с учётом всех видимых фильтров. Отсутствующий объём не считается нулём. Изменение год к году недоступно, если предыдущее значение отсутствует или равно нулю.",
    "forecast.eyebrow": "Статистическая поддержка решений",
    "forecast.title": "Прогноз торговли",
    "forecast.description":
      "Сравните исторические наблюдения, базовый прогноз скользящего среднего и активную модель, обученную на данных проекта. Прогнозы являются оценками, а не гарантией будущих значений.",
    "forecast.definition": "Параметры прогноза",
    "forecast.importer": "Импортёр ISO3",
    "forecast.exporter": "Экспортёр ISO3",
    "forecast.product": "Товар HS2",
    "forecast.year": "Год прогноза",
    "forecast.run": "Рассчитать прогноз",
    "forecast.calculating": "Расчёт…",
    "forecast.errorTitle": "Прогноз недоступен",
    "forecast.error":
      "Для выбранного потока может быть недостаточно истории либо артефакт активной модели недоступен. Выберите другой поток или проверьте состояние данных.",
    "forecast.model": "Прогноз активной модели",
    "forecast.baseline": "Базовый прогноз",
    "forecast.difference": "Отличие модели",
    "forecast.estimate": "оценка на {year} год",
    "forecast.baselineDetail":
      "Трёхлетнее скользящее среднее при наличии данных",
    "supplier.eyebrow": "Объяснимый анализ поставок",
    "supplier.title": "Поиск поставщиков",
    "supplier.description":
      "Ранжируйте потенциальных экспортёров по прозрачным показателям мощности, роста, стабильности, отношений, удельной стоимости и диверсификации — без необъяснимой единой оценки.",
    "supplier.question": "Параметры поиска",
    "supplier.importer": "Страна-импортёр",
    "supplier.product": "Товар HS2",
    "supplier.year": "Опорный год",
    "supplier.find": "Найти поставщиков",
    "supplier.ranking": "Ранжирование…",
    "supplier.error":
      "Не удалось ранжировать кандидатов. Проверьте импортёра, товар и покрытие активных данных.",
    "supplier.empty":
      "Нет экспортёров, соответствующих требованиям положительной торговли и минимальной истории.",
  },
} as const;

export type TranslationKey = keyof (typeof messages)["en"];

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ locale: Locale; hydrated: boolean }>({
    locale: "en",
    hydrated: false,
  });
  const userSelectedLocale = useRef(false);
  const setLocale = useCallback((locale: Locale) => {
    userSelectedLocale.current = true;
    setState({ locale, hydrated: true });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const preferred = getBrowserLocale();
    queueMicrotask(() => {
      if (!cancelled && !userSelectedLocale.current) {
        setState({ locale: preferred, hydrated: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    persistBrowserLocale(state.locale);
  }, [state]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: state.locale,
      setLocale,
      t: (key, values) => {
        let translated: string = messages[state.locale][key];
        for (const [name, replacement] of Object.entries(values ?? {})) {
          translated = translated.replaceAll(`{${name}}`, String(replacement));
        }
        return translated;
      },
    }),
    [setLocale, state.locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

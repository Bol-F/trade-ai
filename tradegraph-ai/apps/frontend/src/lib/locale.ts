export const supportedLocales = ["en", "ru"] as const;
export type Locale = (typeof supportedLocales)[number];

export const localeStorageKey = "tradegraph-locale";
export const localeCookieName = "django_language";

export function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function getBrowserLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(localeStorageKey);
  if (isLocale(stored)) return stored;
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${localeCookieName}=`))
    ?.split("=")[1];
  if (isLocale(cookie)) return cookie;
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function persistBrowserLocale(locale: Locale): void {
  window.localStorage.setItem(localeStorageKey, locale);
  document.cookie = `${localeCookieName}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}

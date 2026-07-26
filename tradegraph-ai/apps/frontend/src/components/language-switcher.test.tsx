import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { LanguageSwitcher } from "@/components/language-switcher"
import { I18nProvider } from "@/lib/i18n"

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.lang = "en"
  })

  it("switches to Russian and persists the locale", async () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: /language: english/i }))

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ru")
      expect(window.localStorage.getItem("tradegraph-locale")).toBe("ru")
    })
    expect(screen.getByRole("button", { name: /язык: русский/i })).toBeInTheDocument()
  })
})

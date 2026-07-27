import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LanguageSwitcher } from "@/components/language-switcher";
import { I18nProvider, useI18n } from "@/lib/i18n";

function TranslatedHeading() {
  const { t } = useI18n();
  return <h1>{t("overview.title")}</h1>;
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("switches to Russian and persists the locale", async () => {
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <TranslatedHeading />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /language: english/i }));

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ru");
      expect(window.localStorage.getItem("tradegraph-locale")).toBe("ru");
    });
    expect(
      screen.getByRole("button", { name: /язык: русский/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Узнайте, кто, чем и с кем торгует и как это меняется.",
      }),
    ).toBeInTheDocument();
  });
});

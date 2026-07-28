"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export function DashboardPageHeader({
  titleKey,
  descriptionKey,
  action,
}: {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  const title = t(titleKey);
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/dashboard" className="hover:text-foreground">
            {t("dashboard.breadcrumb")}
          </Link>
          <ChevronRight aria-hidden="true" className="size-3" />
          <span aria-current="page">{title}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <Badge
            variant="outline"
            className="border-warning/30 bg-warning-surface text-warning"
          >
            {t("dashboard.demoData")}
          </Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t(descriptionKey)}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

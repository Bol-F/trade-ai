import {
  BellRing,
  BrainCircuit,
  ChartNoAxesCombined,
  Eye,
  LayoutDashboard,
  Settings,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export type DashboardNavItem = {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
};

export const dashboardNavigation: DashboardNavItem[] = [
  { labelKey: "dashboard.overview", href: "/dashboard", icon: LayoutDashboard },
  {
    labelKey: "dashboard.signals",
    href: "/dashboard/signals",
    icon: BrainCircuit,
  },
  {
    labelKey: "dashboard.market",
    href: "/dashboard/market",
    icon: ChartNoAxesCombined,
  },
  {
    labelKey: "dashboard.portfolio",
    href: "/dashboard/portfolio",
    icon: WalletCards,
  },
  { labelKey: "dashboard.watchlist", href: "/dashboard/watchlist", icon: Eye },
  { labelKey: "dashboard.alerts", href: "/dashboard/alerts", icon: BellRing },
  {
    labelKey: "dashboard.settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

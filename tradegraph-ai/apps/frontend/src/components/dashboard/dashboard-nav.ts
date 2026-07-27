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

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNavigation: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Signals", href: "/dashboard/signals", icon: BrainCircuit },
  {
    label: "Market Analysis",
    href: "/dashboard/market",
    icon: ChartNoAxesCombined,
  },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: WalletCards },
  { label: "Watchlist", href: "/dashboard/watchlist", icon: Eye },
  { label: "Alerts", href: "/dashboard/alerts", icon: BellRing },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

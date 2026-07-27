/**
 * Isolated adapter for dashboard capabilities that do not yet have backend models.
 * Replace this module with API-backed adapters without changing page components.
 * Every consumer must display the `dataLabel` so illustrative values cannot be
 * mistaken for a connected brokerage account or live market feed.
 */
export const dataLabel = "Illustrative demo data"

export type SignalType = "Bullish" | "Bearish" | "Neutral" | "Watch"
export type RiskLevel = "Low" | "Medium" | "High"

export type DashboardSignal = {
  id: string
  asset: string
  ticker: string
  price: number
  type: SignalType
  target: string
  confidence: number
  risk: RiskLevel
  horizon: string
  createdAt: string
  summary: string
}

export const overviewMetrics = [
  { label: "Total portfolio value", value: "$248,620.40", change: "+1.24%", period: "vs. previous close", direction: "up" },
  { label: "Daily profit / loss", value: "+$3,041.18", change: "+1.24%", period: "today", direction: "up" },
  { label: "Monthly performance", value: "+$11,284.60", change: "+4.76%", period: "past 30 days", direction: "up" },
  { label: "Available balance", value: "$32,780.00", change: "13.18%", period: "of portfolio", direction: "flat" },
] as const

export const performanceSeries = [222400, 224100, 223600, 227800, 229900, 228700, 233200, 236800, 235400, 239100, 241700, 240900, 245300, 248620]

export const allocation = [
  { name: "Technology equities", value: 38 },
  { name: "Broad-market ETFs", value: 27 },
  { name: "Fixed income", value: 18 },
  { name: "Cash", value: 13 },
  { name: "Other", value: 4 },
] as const

export const marketOverview = [
  { ticker: "S&P 500", value: "5,459.12", change: "+0.62%", direction: "up" },
  { ticker: "NASDAQ", value: "17,862.23", change: "+0.91%", direction: "up" },
  { ticker: "DXY", value: "104.28", change: "-0.18%", direction: "down" },
  { ticker: "VIX", value: "13.42", change: "-2.61%", direction: "down" },
] as const

export const signals: DashboardSignal[] = [
  { id: "sig-1", asset: "NVIDIA", ticker: "NVDA", price: 128.44, type: "Bullish", target: "$134–$139", confidence: 84, risk: "Medium", horizon: "1–2 weeks", createdAt: "12 min ago", summary: "Momentum and volume remain constructive, while elevated volatility limits conviction." },
  { id: "sig-2", asset: "Microsoft", ticker: "MSFT", price: 442.31, type: "Watch", target: "$448–$455", confidence: 67, risk: "Low", horizon: "2–4 weeks", createdAt: "38 min ago", summary: "Price is consolidating near resistance with stable fundamentals and neutral short-term momentum." },
  { id: "sig-3", asset: "EUR / USD", ticker: "EURUSD", price: 1.0842, type: "Bearish", target: "1.0710–1.0760", confidence: 73, risk: "High", horizon: "3–7 days", createdAt: "1 hr ago", summary: "Short-term trend weakened after a failed breakout; macro-event risk remains material." },
  { id: "sig-4", asset: "S&P 500 ETF", ticker: "SPY", price: 548.99, type: "Neutral", target: "$542–$556", confidence: 61, risk: "Medium", horizon: "1–3 weeks", createdAt: "2 hrs ago", summary: "Breadth is mixed and index momentum is positive but extended relative to its recent range." },
  { id: "sig-5", asset: "Apple", ticker: "AAPL", price: 224.82, type: "Bullish", target: "$230–$236", confidence: 78, risk: "Medium", horizon: "2–4 weeks", createdAt: "3 hrs ago", summary: "Relative strength improved with supportive volume, though the price remains close to resistance." },
  { id: "sig-6", asset: "US Treasury ETF", ticker: "TLT", price: 93.46, type: "Watch", target: "$91–$96", confidence: 58, risk: "Low", horizon: "1–2 months", createdAt: "5 hrs ago", summary: "Rate sensitivity dominates the setup; trend confirmation is not yet present." },
]

export const holdings = [
  { asset: "NVIDIA", ticker: "NVDA", quantity: 420, average: 102.18, current: 128.44, value: 53944.8, pnl: 11029.2, allocation: 21.7 },
  { asset: "S&P 500 ETF", ticker: "SPY", quantity: 76, average: 511.2, current: 548.99, value: 41723.24, pnl: 2872.04, allocation: 16.8 },
  { asset: "Microsoft", ticker: "MSFT", quantity: 82, average: 401.64, current: 442.31, value: 36269.42, pnl: 3334.94, allocation: 14.6 },
  { asset: "US Treasury ETF", ticker: "TLT", quantity: 310, average: 96.14, current: 93.46, value: 28972.6, pnl: -830.8, allocation: 11.7 },
  { asset: "Apple", ticker: "AAPL", quantity: 105, average: 192.54, current: 224.82, value: 23606.1, pnl: 3389.4, allocation: 9.5 },
] as const

export type WatchlistAsset = {
  asset: string
  ticker: string
  price: number
  change: number
  volume: string
  aiScore: number
  signal: SignalType
  alert: "Enabled" | "Disabled"
}

export const watchlistAssets: WatchlistAsset[] = [
  { asset: "NVIDIA", ticker: "NVDA", price: 128.44, change: 2.8, volume: "312.4M", aiScore: 84, signal: "Bullish", alert: "Enabled" },
  { asset: "Microsoft", ticker: "MSFT", price: 442.31, change: 0.7, volume: "18.2M", aiScore: 67, signal: "Watch", alert: "Enabled" },
  { asset: "EUR / USD", ticker: "EURUSD", price: 1.0842, change: -0.3, volume: "N/A", aiScore: 73, signal: "Bearish", alert: "Disabled" },
  { asset: "Apple", ticker: "AAPL", price: 224.82, change: 1.1, volume: "44.6M", aiScore: 78, signal: "Bullish", alert: "Enabled" },
]

export type DemoAlert = {
  id: string
  category: "Price" | "Signal" | "Risk" | "Market event"
  asset: string
  condition: string
  status: "Active" | "Paused" | "Triggered"
  created: string
  lastTriggered: string
  channel: "In-app" | "Email + in-app"
}

export const demoAlerts: DemoAlert[] = [
  { id: "alert-1", category: "Risk", asset: "EUR/USD", condition: "Volatility score above 70", status: "Triggered", created: "Jul 23, 2026", lastTriggered: "12 min ago", channel: "Email + in-app" },
  { id: "alert-2", category: "Price", asset: "NVDA", condition: "Price above $130", status: "Active", created: "Jul 22, 2026", lastTriggered: "Never", channel: "In-app" },
  { id: "alert-3", category: "Signal", asset: "MSFT", condition: "Signal changes to Bullish", status: "Active", created: "Jul 20, 2026", lastTriggered: "Never", channel: "Email + in-app" },
  { id: "alert-4", category: "Market event", asset: "S&P 500", condition: "High-impact macro event", status: "Paused", created: "Jul 18, 2026", lastTriggered: "Jul 24, 2026", channel: "In-app" },
]

export const marketPriceSeries: Record<string, number[]> = {
  "1H": [126.8, 127.1, 126.9, 127.6, 127.4, 128.0, 128.44],
  "1D": [124.2, 125.1, 124.8, 126.4, 127.2, 127.8, 128.44],
  "1W": [121.4, 123.8, 122.6, 125.2, 124.9, 127.1, 128.44],
  "1M": [116.2, 119.4, 118.1, 122.8, 121.9, 126.2, 128.44],
  "3M": [93.7, 101.2, 108.6, 116.4, 112.9, 124.1, 128.44],
  "1Y": [47.5, 61.2, 72.4, 89.1, 96.8, 118.2, 128.44],
}

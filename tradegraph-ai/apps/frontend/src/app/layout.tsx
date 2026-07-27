import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "Trade AI — Explainable Market Intelligence",
    template: "%s | Trade AI",
  },
  description:
    "Analyze market trends, opportunities, and risk with explainable AI-assisted market intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <TooltipProvider>
            <a
              href="#main-content"
              className="sr-only z-[100] rounded bg-background p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main-content">{children}</main>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}

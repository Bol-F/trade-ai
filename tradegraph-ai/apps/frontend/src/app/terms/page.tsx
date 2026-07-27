import type { Metadata } from "next"

import { PageContainer } from "@/components/page-container"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of Trade AI analytical software.",
}

export default function TermsPage() {
  return (
    <PageContainer className="py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: July 27, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
          <section><h2 className="text-lg font-semibold text-foreground">Analytical service</h2><p className="mt-2">Trade AI provides software-generated analytical information. It does not execute trades, hold customer assets, guarantee performance, or replace professional financial advice.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground">User responsibility</h2><p className="mt-2">You remain responsible for validating information and for every financial or operational decision you make. Financial markets involve substantial uncertainty and possible loss.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground">Acceptable use</h2><p className="mt-2">Do not attempt unauthorized access, interfere with service operation, misuse another account, or use the platform in violation of applicable law.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground">Availability and changes</h2><p className="mt-2">Features, illustrative pricing, model outputs, and data availability may change. Historical and demo values do not represent promised future results.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground">Pre-launch notice</h2><p className="mt-2">These project terms are a clear product placeholder and must be reviewed by qualified counsel before commercial launch.</p></section>
        </div>
      </article>
    </PageContainer>
  )
}

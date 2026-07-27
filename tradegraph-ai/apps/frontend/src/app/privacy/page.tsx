import type { Metadata } from "next";

import { PageContainer } from "@/components/page-container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Trade AI handles account and product data.",
};

export default function PrivacyPage() {
  return (
    <PageContainer className="py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: July 27, 2026
        </p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              Information we process
            </h2>
            <p className="mt-2">
              Trade AI processes account details you provide, saved analytical
              preferences, and essential security and operational logs. Market
              analysis inputs are used to provide the requested product
              experience.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              How information is used
            </h2>
            <p className="mt-2">
              Information is used to authenticate users, operate and secure the
              platform, preserve user workspaces, diagnose failures, and improve
              product reliability. We do not describe analytical outputs as
              guaranteed outcomes.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              Storage and access
            </h2>
            <p className="mt-2">
              Access is limited according to product roles and operational need.
              Retention should be limited to the period needed for the service,
              security, and applicable legal obligations.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              Your choices
            </h2>
            <p className="mt-2">
              You may request access, correction, or deletion of your account
              information by contacting privacy@trade-ai.example. Some records
              may be retained where required for security or legal obligations.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="mt-2">
              Questions about this policy can be sent to
              privacy@trade-ai.example. This project policy should be reviewed
              by qualified counsel before commercial launch.
            </p>
          </section>
        </div>
      </article>
    </PageContainer>
  );
}

import { getHealth } from "@/lib/api";
import { PageContainer } from "@/components/page-container";
export const dynamic = "force-dynamic";
export default async function StatusPage() {
  let status = "unavailable";
  let checks: { postgres: boolean; redis: boolean } | undefined;
  try {
    const health = await getHealth();
    status = health.status;
    checks = health.checks;
  } catch {
    status = "unavailable";
  }
  return (
    <PageContainer className="py-16">
      <h1 className="text-4xl font-semibold">System status</h1>
      <p className="mt-3 text-muted-foreground">
        Live dependency readiness from the TradeGraph API.
      </p>
      <div className="mt-10 max-w-xl rounded-xl border bg-card p-6">
        <div className="flex justify-between border-b pb-4">
          <span>API</span>
          <span className="font-mono text-sm">{status}</span>
        </div>
        {checks &&
          Object.entries(checks).map(([name, ready]) => (
            <div
              key={name}
              className="flex justify-between border-b py-4 last:border-0"
            >
              <span className="capitalize">{name}</span>
              <span className="font-mono text-sm">
                {ready ? "ready" : "unavailable"}
              </span>
            </div>
          ))}
      </div>
    </PageContainer>
  );
}

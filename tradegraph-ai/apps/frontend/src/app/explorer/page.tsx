import { Suspense } from "react";
import { ExplorerDashboard } from "@/components/explorer-dashboard";

export default function ExplorerPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading Explorer…</div>}>
      <ExplorerDashboard />
    </Suspense>
  );
}

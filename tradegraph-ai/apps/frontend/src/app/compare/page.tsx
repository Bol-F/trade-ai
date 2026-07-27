import { Suspense } from "react";
import { ComparisonDashboard } from "@/components/comparison-dashboard";
export default function ComparePage() {
  return (
    <Suspense>
      <ComparisonDashboard />
    </Suspense>
  );
}

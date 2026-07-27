import { PageContainer } from "@/components/page-container";
export default function Loading() {
  return (
    <PageContainer className="py-20">
      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-5 h-12 max-w-xl animate-pulse rounded bg-muted" />
      <div className="mt-8 h-48 animate-pulse rounded-xl bg-muted" />
    </PageContainer>
  );
}

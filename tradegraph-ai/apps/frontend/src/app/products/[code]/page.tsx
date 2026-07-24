import { ProductAnalyticsProfile } from "@/components/analytics-profiles"
export default async function ProductPage({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <ProductAnalyticsProfile code={code} /> }

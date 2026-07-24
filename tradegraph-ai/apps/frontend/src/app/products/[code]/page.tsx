import { ProductDetail } from "@/components/catalog-detail"
export default async function ProductPage({ params }: { params: Promise<{ code: string }> }) { const { code } = await params; return <ProductDetail code={code} /> }

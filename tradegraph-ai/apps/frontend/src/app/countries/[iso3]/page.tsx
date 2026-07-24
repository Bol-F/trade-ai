import { CountryDetail } from "@/components/catalog-detail"
export default async function CountryPage({ params }: { params: Promise<{ iso3: string }> }) { const { iso3 } = await params; return <CountryDetail iso3={iso3} /> }

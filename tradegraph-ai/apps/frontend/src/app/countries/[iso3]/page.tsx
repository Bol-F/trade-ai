import { CountryAnalyticsProfile } from "@/components/analytics-profiles";
export default async function CountryPage({
  params,
}: {
  params: Promise<{ iso3: string }>;
}) {
  const { iso3 } = await params;
  return <CountryAnalyticsProfile iso3={iso3} />;
}

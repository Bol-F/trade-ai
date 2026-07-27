import Link from "next/link";
import { PageHeader } from "@/components/design-system";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { methodologyTopics } from "@/lib/methodology";

export default function MethodologyPage() {
  return (
    <PageContainer className="py-10">
      <PageHeader
        eyebrow="Methodology center"
        title="Understand every metric before using it"
        description="Plain-language definitions, formulas, examples, valid ranges, limitations, and misuse warnings for TradeGraph analytics."
        breadcrumbs={[
          { label: "Overview", href: "/" },
          { label: "Methodology" },
        ]}
      />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {Object.entries(methodologyTopics).map(([slug, topic]) => (
          <Link href={`/methodology/${slug}`} key={slug}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {topic.meaning}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}

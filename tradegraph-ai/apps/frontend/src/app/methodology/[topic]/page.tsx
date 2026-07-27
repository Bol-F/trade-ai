import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design-system";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { methodologyTopics } from "@/lib/methodology";

export default async function MethodologyTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const item = methodologyTopics[topic as keyof typeof methodologyTopics];
  if (!item) notFound();
  const sections = [
    ["What it means", item.meaning],
    ["Formula", item.formula],
    ["Input data", item.input],
    ["Example", item.example],
    ["Valid range", item.range],
    ["Limitations", item.limitations],
    ["How to interpret it", item.interpret],
    ["How not to interpret it", item.misuse],
  ];
  return (
    <PageContainer className="py-10">
      <PageHeader
        eyebrow="Methodology center"
        title={item.title}
        description={item.meaning}
        breadcrumbs={[
          { label: "Methodology", href: "/methodology" },
          { label: item.title },
        ]}
      />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {sections.map(([title, content]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {content}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}

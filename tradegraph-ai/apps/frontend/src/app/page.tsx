import Link from "next/link"
import { ArrowRight, Globe2, Network, Sparkles } from "lucide-react"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const features = [
    { Icon: Globe2, title: "Global context", text: "Explore countries, products, and flows in one analytical space." },
    { Icon: Network, title: "Graph perspective", text: "Understand relationships instead of isolated rows." },
    { Icon: Sparkles, title: "Explainable AI", text: "Forecasting and recommendations follow the data foundation." },
  ]
  return (
    <PageContainer className="py-20 md:py-32">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" /> Foundation preview
        </div>
        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">See global trade as a connected system.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">TradeGraph AI will turn complex trade flows into explainable maps, comparisons, and decision-ready signals.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/explorer">Open explorer <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/methodology">Read methodology</Link></Button>
        </div>
      </div>
      <div className="mt-20 grid gap-4 border-t pt-8 md:grid-cols-3">
        {features.map(({ Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <Icon className="mb-6 size-5 text-primary" />
            <h2 className="font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}

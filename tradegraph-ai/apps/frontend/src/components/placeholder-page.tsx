import { PageContainer } from "@/components/page-container"
export function PlaceholderPage({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <PageContainer className="py-16 md:py-24"><p className="font-mono text-xs uppercase tracking-widest text-primary">{eyebrow}</p><h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p><div className="mt-12 rounded-xl border bg-card p-8 text-sm text-muted-foreground">This foundation route is ready for a future product milestone.</div></PageContainer>
}

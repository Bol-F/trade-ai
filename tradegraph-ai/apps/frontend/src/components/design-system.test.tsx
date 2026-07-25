import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { EmptyState, ErrorState, PageHeader, RiskIndicator } from "@/components/design-system"

describe("design system states", () => {
  it("provides a navigable page hierarchy", () => {
    render(<PageHeader breadcrumbs={[{ label: "Explorer", href: "/explorer" }, { label: "Uzbekistan" }]} title="Country profile" description="Evidence-led analysis." />)
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Country profile" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Explorer" })).toHaveAttribute("href", "/explorer")
  })

  it("announces empty and error states", () => {
    render(<><EmptyState title="No results" description="Change filters." /><ErrorState title="Unable to load" description="Try again." /></>)
    expect(screen.getByText("No results")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load")
  })

  it("exposes the risk score in text as well as color", () => {
    render(<RiskIndicator score={72} />)
    expect(screen.getByText("High exposure")).toBeInTheDocument()
    expect(screen.getByLabelText("High exposure, 72.0 out of 100")).toBeInTheDocument()
  })
})

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ConfidenceIndicator,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  RiskIndicator,
  StatusBadge,
} from "@/components/design-system";

describe("design system states", () => {
  it("provides a navigable page hierarchy", () => {
    render(
      <PageHeader
        breadcrumbs={[
          { label: "Explorer", href: "/explorer" },
          { label: "Uzbekistan" },
        ]}
        title="Country profile"
        description="Evidence-led analysis."
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Country profile" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorer" })).toHaveAttribute(
      "href",
      "/explorer",
    );
  });

  it("announces empty and error states", () => {
    render(
      <>
        <EmptyState title="No results" description="Change filters." />
        <ErrorState title="Unable to load" description="Try again." />
      </>,
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load");
  });

  it("exposes the risk score in text as well as color", () => {
    render(<RiskIndicator score={72} />);
    expect(screen.getByText("High exposure")).toBeInTheDocument();
    expect(
      screen.getByLabelText("High exposure, 72.0 out of 100"),
    ).toBeInTheDocument();
  });

  it("bounds confidence and communicates status with text and icon", () => {
    render(
      <>
        <ConfidenceIndicator value={140} />
        <StatusBadge tone="success">Model validated</StatusBadge>
      </>,
    );
    expect(
      screen.getByLabelText("Model confidence: High, 100 percent"),
    ).toBeInTheDocument();
    expect(screen.getByText("Model validated")).toBeInTheDocument();
  });

  it("announces indeterminate loading work", () => {
    render(<LoadingState label="Refreshing market evidence…" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Refreshing market evidence…",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/components/landing-page";

describe("LandingPage", () => {
  it("presents the complete product story and honest risk disclosure", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Smarter Market Decisions Powered by AI",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "One clear view of opportunity and risk",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Choose the right research depth" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Trade AI provides analytical information only/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Illustrative/).length).toBeGreaterThan(1);
  });

  it("does not make prohibited performance claims", () => {
    const { container } = render(<LandingPage />);
    const content = container.textContent?.toLowerCase() ?? "";

    expect(content).not.toContain("guaranteed profit");
    expect(content).not.toContain("risk-free trading");
    expect(content).not.toContain("win every trade");
    expect(content).not.toContain("100% accurate");
  });
});

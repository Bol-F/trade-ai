import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageContainer } from "./page-container";
describe("PageContainer", () => {
  it("renders its content", () => {
    render(<PageContainer>Trade intelligence</PageContainer>);
    expect(screen.getByText("Trade intelligence")).toBeInTheDocument();
  });
});

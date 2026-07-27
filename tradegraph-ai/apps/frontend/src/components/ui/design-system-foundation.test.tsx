import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Switch } from "@/components/ui/switch";
import { ToastProvider, useToast } from "@/components/ui/toast";

describe("core design-system controls", () => {
  it("exposes button loading state and prevents duplicate actions", () => {
    render(<Button loading>Recalculate</Button>);
    const button = screen.getByRole("button", { name: "Recalculate" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("supports labelled checkbox and switch interactions", () => {
    render(
      <>
        <Checkbox aria-label="Include delayed data" />
        <Switch aria-label="Enable risk alerts" />
      </>,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: "Include delayed data",
    });
    const toggle = screen.getByRole("switch", { name: "Enable risk alerts" });
    fireEvent.click(checkbox);
    fireEvent.click(toggle);
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(toggle).toHaveAttribute("data-state", "checked");
  });

  it("provides a keyboard-accessible search clear action", () => {
    let cleared = false;
    render(
      <SearchInput
        aria-label="Search instruments"
        value="energy"
        readOnly
        onClear={() => {
          cleared = true;
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(cleared).toBe(true);
  });

  it("renders modal title and description semantics", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Confirm export</DialogTitle>
          <DialogDescription>
            The report contains filtered trade data.
          </DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(
      screen.getByRole("dialog", { name: "Confirm export" }),
    ).toHaveAccessibleDescription("The report contains filtered trade data.");
    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toBeInTheDocument();
  });
});

function ToastFixture() {
  const { toast } = useToast();
  return (
    <Button
      onClick={() =>
        toast({
          tone: "success",
          title: "Analysis saved",
          description: "Available in your workspace.",
        })
      }
    >
      Save
    </Button>
  );
}

describe("toast feedback", () => {
  it("announces and dismisses a semantic notification", () => {
    render(
      <ToastProvider>
        <ToastFixture />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("status")).toHaveTextContent("Analysis saved");
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(screen.queryByText("Analysis saved")).not.toBeInTheDocument();
  });
});

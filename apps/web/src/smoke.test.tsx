import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("web smoke", () => {
  it("renders in jsdom", () => {
    render(<div>ok</div>);
    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});

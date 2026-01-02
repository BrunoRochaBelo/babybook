import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StampGenerator } from "./StampGenerator";

class MockWorker {
  public onmessage: ((ev: MessageEvent) => void) | null = null;
  public onerror: ((ev: Event) => void) | null = null;
  public postMessage = vi.fn();
  public terminate = vi.fn();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_url?: unknown, _options?: unknown) {}
}

describe("StampGenerator", () => {
  it("renderiza dicas e CTA de upload (estado inicial)", () => {
    vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);

    render(<StampGenerator type="hand" onSuccess={() => {}} />);

    expect(screen.getByText("Mãozinha")).toBeInTheDocument();
    expect(screen.getByText("Escolher Foto")).toBeInTheDocument();
    expect(screen.getByText("Dicas para melhor resultado")).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "@babybook/ui";

describe("Card component", () => {
  it("renders title and children", () => {
    render(
      <Card title="Teste" description="Descrição">
        <span>Conteúdo</span>
      </Card>
    );

    expect(screen.getByText("Teste")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });
});

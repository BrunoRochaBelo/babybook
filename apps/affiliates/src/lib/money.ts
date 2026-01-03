export function formatBRLFromCents(valueCents: number): string {
  const value = valueCents / 100;
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function percent(value: number): string {
  return `${Math.round(value * 10000) / 100}%`;
}

import { Hono } from "hono";
import { z } from "zod";

type Bindings = {
  API_BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const paramsSchema = z.object({
  token: z.string().min(10)
});

app.get("/s/:token", async (c) => {
  const parseResult = paramsSchema.safeParse(c.req.param());
  if (!parseResult.success) {
    return c.json(
      { error: { code: "share.token.invalid", message: "Token inválido" } },
      400 as any
    );
  }

  const apiBaseUrl = c.env.API_BASE_URL ?? "http://localhost:8000";
  const response = await fetch(`${apiBaseUrl}/shares/${parseResult.data.token}`);

  if (!response.ok) {
    return c.json(await response.json(), response.status as any);
  }

  const payload = await response.json();
  return c.html(
    `<html><body><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`
  );
});

export default app;

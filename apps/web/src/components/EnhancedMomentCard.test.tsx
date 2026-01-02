import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

import type { Moment } from "@babybook/contracts";

vi.mock("@babybook/i18n", () => ({
  useTranslation: () => ({
    i18n: { language: "pt-BR" },
    t: (key: string, options?: any) => {
      // Mapeamento mínimo para manter os testes determinísticos.
      const count = options?.count;

      if (key === "common.and") return "e";
      if (key === "common.edit") return "Editar";
      if (key === "common.close") return "Fechar";

      if (key === "b2c.moments.card.actions.openFeatured")
        return "Abrir mídia em destaque";
      if (key === "b2c.moments.card.actions.openPhoto") return "Abrir foto";
      if (key === "b2c.moments.card.actions.openVideo") return "Abrir vídeo";
      if (key === "b2c.moments.card.dialog.label")
        return "Visualização de mídia";
      if (key === "b2c.moments.card.actions.prevMedia") return "Mídia anterior";
      if (key === "b2c.moments.card.actions.nextMedia") return "Próxima mídia";
      if (key === "b2c.moments.card.actions.seeMore") return "Ver mais";
      if (key === "b2c.moments.card.actions.seeLess") return "Ver menos";
      if (key === "b2c.moments.card.noDescription") return "Sem descrição...";
      if (key === "b2c.moments.card.noMedia.title") return "Sem mídia";
      if (key === "b2c.moments.card.noMedia.description")
        return "Você pode adicionar fotos ou vídeos depois.";

      if (key === "b2c.moments.card.age.years")
        return `${count} ${count === 1 ? "ano" : "anos"}`;
      if (key === "b2c.moments.card.age.months")
        return `${count} ${count === 1 ? "mês" : "meses"}`;
      if (key === "b2c.moments.card.age.days")
        return `${count} ${count === 1 ? "dia" : "dias"}`;

      return key;
    },
  }),
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");

  const passthrough = (Tag: any) =>
    React.forwardRef(({ children, ...rest }: any, ref: any) => {
      // Remove props de animação/layout para não vazarem no DOM durante testes.
      // (Evita warnings do React em JSDOM.)
      const {
        layout,
        layoutId,
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        variants,
        onAnimationComplete,
        ...domProps
      } = rest;

      return React.createElement(Tag, { ref, ...domProps }, children);
    });

  const motionProxy = new Proxy(
    {},
    {
      get: (_target, key) => passthrough(key),
    },
  );

  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    LayoutGroup: ({ children }: any) => <>{children}</>,
    motion: motionProxy,
  };
});

import { EnhancedMomentCard } from "./EnhancedMomentCard";

vi.mock("@/hooks/useSelectedChild", () => ({
  useSelectedChild: () => ({
    selectedChild: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Bebê",
      birthday: "2025-12-10T00:00:00.000Z",
      avatarUrl: null,
      createdAt: "2025-12-10T00:00:00.000Z",
      updatedAt: "2025-12-10T00:00:00.000Z",
    },
  }),
}));

vi.mock("@/store/auth", () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: {
        id: "22222222-2222-2222-2222-222222222222",
        email: "owner@example.com",
        name: "Owner",
        locale: "pt-BR",
        role: "owner",
        hasPurchased: true,
        onboardingCompleted: true,
      },
    }),
}));

vi.mock("@/lib/media", () => ({
  getMediaUrl: (media: any) => media?.url ?? "https://example.com/placeholder",
}));

vi.mock("@/data/momentCatalog", () => ({
  getMomentByTemplateKey: () => ({
    fields: [{ key: "theme", label: "Tema", type: "text" }],
  }),
}));

describe("EnhancedMomentCard", () => {
  beforeEach(() => {
    // Evita que um teste vaze estado para o outro.
    document.body.style.overflow = "";
  });

  it("renderiza cabeçalho com data, idade e info extra", () => {
    const moment: Moment = {
      id: "33333333-3333-3333-3333-333333333333",
      childId: "11111111-1111-1111-1111-111111111111",
      templateKey: "capitulo_1_cha_bebe",
      title: "Chá Revelação",
      summary: "Um dia especial",
      // Meio do dia em UTC evita oscilações de fuso (ex.: BR-3) nos testes.
      occurredAt: "2026-03-12T12:00:00.000Z",
      status: "published",
      privacy: "private",
      payload: {
        theme: "Safari",
        relato: "Um texto longo o suficiente para permitir ver mais. ".repeat(
          5,
        ),
      },
      rev: 1,
      createdAt: "2026-03-12T12:00:00.000Z",
      updatedAt: "2026-03-12T12:00:00.000Z",
      publishedAt: "2026-03-12T12:00:00.000Z",
      media: [
        {
          id: "m1",
          kind: "photo",
          url: "https://example.com/1.jpg",
          key: null,
          durationSeconds: undefined,
          variants: [],
        },
        {
          id: "m2",
          kind: "photo",
          url: "https://example.com/2.jpg",
          key: null,
          durationSeconds: undefined,
          variants: [],
        },
        {
          id: "m3",
          kind: "photo",
          url: "https://example.com/3.jpg",
          key: null,
          durationSeconds: undefined,
          variants: [],
        },
        {
          id: "v1",
          kind: "video",
          url: "https://example.com/v.mp4",
          key: null,
          durationSeconds: 30,
          variants: [],
        },
      ],
    };

    render(
      <MemoryRouter>
        <EnhancedMomentCard moment={moment} />
      </MemoryRouter>,
    );

    expect(screen.getByText("12 de Março")).toBeInTheDocument();
    expect(screen.getByText("3 meses e 2 dias")).toBeInTheDocument();
    expect(screen.getByText("Chá Revelação")).toBeInTheDocument();
    expect(screen.getByText("Tema: Safari")).toBeInTheDocument();

    // Owner-only
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
  });

  it("expande e fecha a mídia (overlay/dialog)", async () => {
    const moment: Moment = {
      id: "44444444-4444-4444-4444-444444444444",
      childId: "11111111-1111-1111-1111-111111111111",
      templateKey: "capitulo_1_cha_bebe",
      title: "Momento",
      summary: null,
      occurredAt: "2026-03-12T12:00:00.000Z",
      status: "published",
      privacy: "private",
      payload: { theme: "Safari", relato: "Texto" },
      rev: 1,
      createdAt: "2026-03-12T12:00:00.000Z",
      updatedAt: "2026-03-12T12:00:00.000Z",
      publishedAt: "2026-03-12T12:00:00.000Z",
      media: [
        {
          id: "m1",
          kind: "photo",
          url: "https://example.com/1.jpg",
          key: null,
          durationSeconds: undefined,
          variants: [],
        },
      ],
    };

    render(
      <MemoryRouter>
        <EnhancedMomentCard moment={moment} />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /abrir mídia em destaque/i }),
    );

    expect(
      screen.getByRole("dialog", { name: /visualização de mídia/i }),
    ).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /visualização de mídia/i }),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(document.body.style.overflow).toBe(""));
  });

  it("fecha o overlay com ESC", async () => {
    const moment: Moment = {
      id: "55555555-5555-5555-5555-555555555555",
      childId: "11111111-1111-1111-1111-111111111111",
      templateKey: "capitulo_1_cha_bebe",
      title: "Momento",
      summary: null,
      occurredAt: "2026-03-12T12:00:00.000Z",
      status: "published",
      privacy: "private",
      payload: { theme: "Safari", relato: "Texto" },
      rev: 1,
      createdAt: "2026-03-12T12:00:00.000Z",
      updatedAt: "2026-03-12T12:00:00.000Z",
      publishedAt: "2026-03-12T12:00:00.000Z",
      media: [
        {
          id: "m1",
          kind: "photo",
          url: "https://example.com/1.jpg",
          key: null,
          durationSeconds: undefined,
          variants: [],
        },
      ],
    };

    render(
      <MemoryRouter>
        <EnhancedMomentCard moment={moment} />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /abrir mídia em destaque/i }),
    );
    expect(
      screen.getByRole("dialog", { name: /visualização de mídia/i }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /visualização de mídia/i }),
      ).not.toBeInTheDocument(),
    );
  });

  it("permite navegar entre mídias no fullscreen", async () => {
    const moment: Moment = {
      id: "66666666-6666-6666-6666-666666666666",
      childId: "11111111-1111-1111-1111-111111111111",
      templateKey: "capitulo_1_cha_bebe",
      title: "Momento",
      summary: null,
      occurredAt: "2026-03-12T12:00:00.000Z",
      status: "published",
      privacy: "private",
      payload: { theme: "Safari", relato: "Texto" },
      rev: 1,
      createdAt: "2026-03-12T12:00:00.000Z",
      updatedAt: "2026-03-12T12:00:00.000Z",
      publishedAt: "2026-03-12T12:00:00.000Z",
      media: [
        {
          id: "m1",
          kind: "photo",
          url: "https://example.com/1.jpg",
          key: null,
          durationSeconds: undefined,
          variants: [],
        },
        {
          id: "m2",
          kind: "photo",
          url: "https://example.com/2.jpg",
          key: null,
          durationSeconds: undefined,
          variants: [],
        },
      ],
    };

    render(
      <MemoryRouter>
        <EnhancedMomentCard moment={moment} />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /abrir mídia em destaque/i }),
    );

    // Importante: o dialog (e seu conteúdo) pode ser desmontado/remontado
    // quando a mídia ativa muda. Por isso, evitamos guardar referência a nós
    // do DOM e reconsultamos sempre.
    const getDialog = () =>
      screen.getByRole("dialog", {
        name: /visualização de mídia/i,
      });
    const getFullscreenImg = () =>
      getDialog().querySelector(
        "img.object-contain",
      ) as HTMLImageElement | null;

    const img1 = getFullscreenImg();
    if (!img1) throw new Error("Imagem do fullscreen não encontrada");
    expect(img1.getAttribute("src")).toBe("https://example.com/1.jpg");

    fireEvent.click(
      within(getDialog()).getByRole("button", { name: /próxima mídia/i }),
    );

    await waitFor(() => {
      const img2 = getFullscreenImg();
      if (!img2) throw new Error("Imagem do fullscreen não encontrada");
      expect(img2.getAttribute("src")).toBe("https://example.com/2.jpg");
    });
  });
});

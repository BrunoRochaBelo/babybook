import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { Moment } from "@babybook/contracts";
import {
  List,
  Grid2X2,
  Plus,
  History,
  BookOpen,
  Search,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  MOMENT_CATALOG,
  getMomentByTemplateKey,
  normalizeTemplateKey,
  type CatalogSequenceItem,
} from "@/data/momentCatalog";
import { EnhancedMomentCard } from "@/components/EnhancedMomentCard";
import { useSelectedChild } from "@/hooks/useSelectedChild";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { cn } from "@/lib/utils";
import { NextMomentSuggestion } from "./NextMomentSuggestion";
import { JourneyProgressCard } from "./JourneyProgressCard";

interface MomentsTimelineProps {
  moments: Moment[];
  isLoading: boolean;
  nextTemplate?: CatalogSequenceItem | null;
  childName?: string;
  hasBirthday?: boolean;
  completedCount?: number;
}

type ViewMode = "timeline" | "chapters";
type ChaptersLayout = "list" | "grid";
type ChapterFilter = "all" | "todo" | "in_progress" | "done";

type CatalogSearchChapterResult = {
  kind: "chapter";
  chapterId: string;
  score: number;
  matchedExact: boolean;
  matchedTokens: string[];
};

type CatalogSearchMomentResult = {
  kind: "moment";
  chapterId: string;
  template: CatalogSequenceItem;
  score: number;
  matchedExact: boolean;
  matchedTokens: string[];
};

const normalizeForSearch = (value: string) => {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
};

// Sinônimos simples (PT-BR + alguns termos comuns) para melhorar a encontrabilidade.
// Estrutura: termo canônico -> lista de variações/sinônimos.
const SEARCH_SYNONYMS: Record<string, string[]> = {
  gestacao: [
    "gravidez",
    "gravida",
    "gravidinha",
    "prenatal",
    "pre natal",
    "pre-natal",
    "ultrassom",
    "eco",
    "ecografia",
    "pregnancy",
  ],
  nascimento: [
    "parto",
    "cesarea",
    "cesaria",
    "cesariana",
    "normal",
    "maternidade",
    "hospital",
    "sala de parto",
    "delivery",
    "birth",
  ],
  "primeiros dias": [
    "primeiras semanas",
    "recem nascido",
    "recem-nascido",
    "rn",
    "puerperio",
    "puerperio",
    "pos parto",
    "pos-parto",
    "newborn",
  ],
  marcos: [
    "desenvolvimento",
    "conquistas",
    "habilidades",
    "primeiras vezes",
    "marcos de desenvolvimento",
  ],
  celebracoes: [
    "celebracao",
    "comemoracao",
    "festa",
    "datas especiais",
    "aniversario",
    "batizado",
    "batismo",
    "comemorar",
    "celebrations",
  ],
  umbigo: ["cordao", "cordao umbilical", "cordao-umbilical", "coto"],
  dente: ["dentinho", "denticao", "denticao", "primeiro dentinho"],
  amamentacao: ["mamar", "mamadeira", "lactacao", "leite"],
};

const SEARCH_STOPWORDS = new Set([
  "a",
  "o",
  "os",
  "as",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "um",
  "uma",
  "para",
  "pra",
  "pro",
  "por",
  "com",
  "sem",
  "ao",
  "aos",
  "aquela",
  "aquele",
  "seu",
  "sua",
  "seus",
  "suas",
  "bem",
  "vindo",
  "vinda",
]);

const mergeSynonymDictionaries = (
  ...dicts: Array<Record<string, string[]>>
): Record<string, string[]> => {
  const merged = new Map<string, Set<string>>();
  for (const dict of dicts) {
    for (const [canonical, list] of Object.entries(dict)) {
      const key = canonical;
      if (!merged.has(key)) merged.set(key, new Set());
      const set = merged.get(key)!;
      for (const item of list ?? []) set.add(item);
    }
  }
  const out: Record<string, string[]> = {};
  for (const [k, set] of merged.entries()) {
    out[k] = Array.from(set);
  }
  return out;
};

const buildAutoSynonymsFromCatalog = (
  catalog: typeof MOMENT_CATALOG,
): Record<string, string[]> => {
  const out = new Map<string, Set<string>>();

  const add = (canonicalRaw: string, synonymRaw: string) => {
    const canonical = normalizeForSearch(canonicalRaw);
    const synonym = normalizeForSearch(synonymRaw);
    if (!canonical || !synonym) return;
    if (SEARCH_STOPWORDS.has(canonical) || SEARCH_STOPWORDS.has(synonym)) {
      return;
    }
    if (!out.has(canonical)) out.set(canonical, new Set());
    out.get(canonical)!.add(synonymRaw);
  };

  const keySuffix = (templateKey: string) => {
    const normalizedKey = normalizeForSearch(templateKey).replace(/\s+/g, " ");
    // remove prefix do capítulo: "capitulo 1 ..."
    return normalizedKey
      .replace(/^capitulo\s+\d+\s+/, "")
      .replace(/^cap\s+\d+\s+/, "")
      .trim();
  };

  for (const chapter of catalog) {
    const chapterConcept = `${chapter.subtitle} ${chapter.title}`;
    for (const m of chapter.moments) {
      // Mapeia palavras/expressões do templateKey para o título e contexto do capítulo.
      const suffix = keySuffix(m.templateKey);
      if (suffix) {
        add(suffix, m.title);
        add(suffix, chapter.subtitle);
      }

      // Tokens principais do templateKey e do título viram “âncoras” para navegação.
      const tokens = Array.from(
        new Set(
          [
            ...normalizeForSearch(suffix || m.templateKey).split(" "),
            ...normalizeForSearch(m.title).split(" "),
          ]
            .map((t) => t.trim())
            .filter((t) => t.length >= 4 && !SEARCH_STOPWORDS.has(t)),
        ),
      );

      for (const t of tokens) {
        add(t, m.title);
        add(t, suffix || m.templateKey);
        add(t, chapterConcept);
      }
    }
  }

  const result: Record<string, string[]> = {};
  for (const [canonical, set] of out.entries()) {
    result[canonical] = Array.from(set);
  }
  return result;
};

const buildSynonymLookup = (dictionary: Record<string, string[]>) => {
  const canonicalToSynonyms = new Map<string, string[]>();
  const synonymToCanonical = new Map<string, string>();

  for (const [canonicalRaw, list] of Object.entries(dictionary)) {
    const canonical = normalizeForSearch(canonicalRaw);
    const normalizedList = (list ?? []).map((s) => normalizeForSearch(s));
    canonicalToSynonyms.set(canonical, normalizedList);
    for (const syn of normalizedList) {
      if (syn && !synonymToCanonical.has(syn)) {
        synonymToCanonical.set(syn, canonical);
      }
    }
  }

  return { canonicalToSynonyms, synonymToCanonical };
};

type SynonymLookup = ReturnType<typeof buildSynonymLookup>;

const SEARCH_LOOKUP: SynonymLookup = buildSynonymLookup(
  mergeSynonymDictionaries(
    SEARCH_SYNONYMS,
    buildAutoSynonymsFromCatalog(MOMENT_CATALOG),
  ),
);

const computeSearchTokens = (query: string, lookup: SynonymLookup) => {
  const q = normalizeForSearch(query);
  if (!q) return { q: "", tokens: [] as string[] };

  const parts = q.split(" ").filter(Boolean);
  const bigrams = parts
    .slice(0, -1)
    .map((p, i) => `${p} ${parts[i + 1]}`)
    .filter(Boolean);

  const base = [...parts, ...bigrams];
  const out = new Set<string>();

  for (const t of base) {
    out.add(t);

    const canonical = lookup.synonymToCanonical.get(t);
    if (canonical) {
      out.add(canonical);
      for (const syn of lookup.canonicalToSynonyms.get(canonical) ?? []) {
        out.add(syn);
      }
      continue;
    }

    const syns = lookup.canonicalToSynonyms.get(t);
    if (syns) {
      for (const syn of syns) out.add(syn);
    }
  }

  return { q, tokens: Array.from(out).filter(Boolean) };
};

const analyzeMatch = (normalizedText: string, q: string, tokens: string[]) => {
  if (!q) {
    return { score: 0, matchedExact: false, matchedTokens: [] as string[] };
  }
  if (!normalizedText) {
    return { score: 0, matchedExact: false, matchedTokens: [] as string[] };
  }

  let score = 0;
  const matchedTokens: string[] = [];

  const includesQ = normalizedText.includes(q);
  const startsWithQ = normalizedText.startsWith(q);

  // Match direto do termo inteiro.
  if (includesQ) score += 8;
  if (startsWithQ) score += 4;

  // Tokens (incluindo expansão por sinônimos)
  for (const token of tokens) {
    if (!token) continue;
    if (normalizedText.includes(token)) {
      matchedTokens.push(token);
      score += token.length >= 5 ? 2 : 1;
    }
  }

  return {
    score,
    matchedExact: includesQ || startsWithQ,
    matchedTokens: Array.from(new Set(matchedTokens)).slice(0, 6),
  };
};

const uniq = (values: string[]) => Array.from(new Set(values));

const buildNormalizedTextAndMap = (input: string) => {
  // Produz uma versão normalizada (acentos-insensível) e um mapa do índice
  // do texto normalizado -> índice (code unit) no texto original.
  const map: number[] = [];
  const outChars: string[] = [];

  let originalIndex = 0;
  for (const ch of input ?? "") {
    const start = originalIndex;
    originalIndex += ch.length;

    // normaliza este "char" para remover acentos
    const base = ch
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    for (const raw of base) {
      const c = raw === "_" || raw === "-" ? " " : raw;
      const keep = /[\p{L}\p{N}]/u.test(c) ? c : " ";
      const prev = outChars[outChars.length - 1];
      if (prev === " " && keep === " ") {
        continue;
      }
      outChars.push(keep);
      map.push(start);
    }
  }

  return { normalized: outChars.join(""), map };
};

const mergeRanges = (ranges: Array<{ start: number; end: number }>) => {
  const sorted = ranges
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);
  const out: Array<{ start: number; end: number }> = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (!last || r.start > last.end) {
      out.push({ ...r });
    } else {
      last.end = Math.max(last.end, r.end);
    }
  }
  return out;
};

const renderHighlightedText = (text: string, highlightTokens: string[]) => {
  const tokens = uniq(
    highlightTokens
      .map((t) => normalizeForSearch(t))
      .flatMap((t) => t.split(" "))
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !SEARCH_STOPWORDS.has(t)),
  ).slice(0, 8);

  if (!text || tokens.length === 0) return text;

  const { normalized, map } = buildNormalizedTextAndMap(text);
  if (!normalized || map.length === 0) return text;

  const ranges: Array<{ start: number; end: number }> = [];

  for (const token of tokens) {
    let idx = normalized.indexOf(token);
    while (idx !== -1) {
      const startOrig = map[idx];
      const endPos = idx + token.length;
      const endOrig = endPos < map.length ? map[endPos] : text.length;
      if (startOrig < endOrig) {
        ranges.push({ start: startOrig, end: endOrig });
      }
      idx = normalized.indexOf(token, idx + token.length);
    }
  }

  const merged = mergeRanges(ranges);
  if (merged.length === 0) return text;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach((r, i) => {
    if (cursor < r.start) {
      nodes.push(text.slice(cursor, r.start));
    }
    nodes.push(
      <mark
        key={`hl-${i}`}
        className="rounded px-1"
        style={{
          backgroundColor: "rgba(242,153,93,0.22)",
          color: "inherit",
        }}
      >
        {text.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  });
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return <>{nodes}</>;
};

export const MomentsTimeline = ({
  moments,
  isLoading,
  nextTemplate = null,
  childName,
  hasBirthday = false,
  completedCount = 0,
}: MomentsTimelineProps) => {
  const navigate = useNavigate();
  const { selectedChild } = useSelectedChild();
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    null,
  );
  const [chaptersLayout, setChaptersLayout] = useState<ChaptersLayout>("list");
  const [chapterQuery, setChapterQuery] = useState("");
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>("all");

  const chapterCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtersWrapRef = useRef<HTMLDivElement | null>(null);
  const filtersSentinelRef = useRef<HTMLDivElement | null>(null);
  const [filtersPinned, setFiltersPinned] = useState(false);
  const [filtersPinnedStyle, setFiltersPinnedStyle] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Scroll restoration - preserves position when navigating back
  useScrollRestoration({ key: "moments-timeline", delay: 100 });

  // Sticky fallback: alguns containers/overflows podem impedir o `position: sticky`.
  // Então usamos um sentinel + position: fixed quando necessário.
  useEffect(() => {
    if (viewMode !== "chapters") {
      setFiltersPinned(false);
      setFiltersPinnedStyle(null);
      return;
    }

    const computeHeaderTop = () => {
      const header = document.querySelector("header");
      const headerH = header?.getBoundingClientRect().height ?? 0;
      // 12px de respiro para não colar no header
      return Math.round(headerH + 12);
    };

    const recompute = () => {
      const wrap = filtersWrapRef.current;
      const sentinel = filtersSentinelRef.current;
      if (!wrap || !sentinel) return;

      const top = computeHeaderTop();
      const sentinelRect = sentinel.getBoundingClientRect();
      const shouldPin = sentinelRect.top <= top;

      // Sempre recalcula dimensões (evita “pular” ao alternar layout/resize)
      const wrapRect = wrap.getBoundingClientRect();
      const height = wrapRect.height;

      setFiltersPinned(shouldPin);
      setFiltersPinnedStyle({
        top,
        left: Math.round(wrapRect.left),
        width: Math.round(wrapRect.width),
        height: Math.round(height),
      });
    };

    const findScrollParent = (node: HTMLElement | null) => {
      let el: HTMLElement | null = node;
      while (el) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        const isScrollableY =
          (overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight;
        const isScrollableX =
          (overflowX === "auto" || overflowX === "scroll") &&
          el.scrollWidth > el.clientWidth;
        if (isScrollableY || isScrollableX) {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    const onScroll = () => recompute();
    const onResize = () => recompute();

    // Alvos: window + um possível scroller interno (ancestral com overflow auto/scroll)
    const scrollParent = findScrollParent(filtersWrapRef.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    scrollParent?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // Primeira medição após layout
    const raf = window.requestAnimationFrame(recompute);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      scrollParent?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [viewMode, chaptersLayout, chapterQuery, chapterFilter]);

  const publishedTemplateKeys = useMemo(
    () =>
      new Set(
        (moments ?? [])
          .filter((moment) => moment.status === "published")
          .map((moment) => normalizeTemplateKey(moment.templateKey))
          .filter((templateKey): templateKey is string => Boolean(templateKey)),
      ),
    [moments],
  );

  const chapterProgress = useMemo(
    () =>
      MOMENT_CATALOG.map((chapter) => {
        const total = chapter.moments.length;
        const completed = chapter.moments.filter((moment) =>
          publishedTemplateKeys.has(moment.templateKey),
        ).length;
        const nextMoment = chapter.moments.find(
          (moment) => !publishedTemplateKeys.has(moment.templateKey),
        );
        const progressPercent = total === 0 ? 0 : (completed / total) * 100;

        return {
          ...chapter,
          completed,
          total,
          nextMoment,
          progressPercent,
        };
      }),
    [publishedTemplateKeys],
  );

  function chapterStatus(completed: number, total: number) {
    if (total > 0 && completed >= total) {
      return {
        key: "done" as const,
        label: "Concluído",
        tone: "success" as const,
      };
    }
    if (completed > 0) {
      return {
        key: "in_progress" as const,
        label: "Em andamento",
        tone: "warning" as const,
      };
    }
    return {
      key: "todo" as const,
      label: "Não iniciado",
      tone: "neutral" as const,
    };
  }

  const filteredChaptersByStatus = useMemo(() => {
    return chapterProgress.filter((chapter) => {
      const status = chapterStatus(chapter.completed, chapter.total);
      if (chapterFilter !== "all" && status.key !== chapterFilter) {
        return false;
      }
      return true;
    });
  }, [chapterFilter, chapterProgress]);

  const catalogSearch = useMemo(() => {
    const { q, tokens } = computeSearchTokens(chapterQuery, SEARCH_LOOKUP);
    if (!q) {
      return {
        query: "",
        chapterResults: [] as CatalogSearchChapterResult[],
        momentResults: [] as CatalogSearchMomentResult[],
        matchChapterIds: null as Set<string> | null,
      };
    }

    const chapterResults: CatalogSearchChapterResult[] = [];
    const momentResults: CatalogSearchMomentResult[] = [];
    const matchChapterIds = new Set<string>();

    for (const chapter of filteredChaptersByStatus) {
      const chapterText = normalizeForSearch(
        `${chapter.title} ${chapter.subtitle} ${chapter.range}`,
      );
      const chapterMatch = analyzeMatch(chapterText, q, tokens);
      if (chapterMatch.score > 0) {
        chapterResults.push({
          kind: "chapter",
          chapterId: chapter.id,
          score: chapterMatch.score,
          matchedExact: chapterMatch.matchedExact,
          matchedTokens: chapterMatch.matchedTokens,
        });
        matchChapterIds.add(chapter.id);
      }

      for (const template of chapter.moments) {
        const momentText = normalizeForSearch(
          `${template.title} ${template.prompt} ${template.templateKey}`,
        );
        const momentMatch = analyzeMatch(momentText, q, tokens);
        if (momentMatch.score > 0) {
          const sequenceTemplate: CatalogSequenceItem =
            getMomentByTemplateKey(template.templateKey) ??
            ({
              ...template,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              chapterSubtitle: chapter.subtitle,
              chapterAccent: chapter.accent,
              range: chapter.range,
              order: 0,
            } satisfies CatalogSequenceItem);

          momentResults.push({
            kind: "moment",
            chapterId: chapter.id,
            template: sequenceTemplate,
            score: momentMatch.score,
            matchedExact: momentMatch.matchedExact,
            matchedTokens: momentMatch.matchedTokens,
          });
          matchChapterIds.add(chapter.id);
        }
      }
    }

    chapterResults.sort((a, b) => b.score - a.score);
    momentResults.sort((a, b) => b.score - a.score);

    return {
      query: q,
      chapterResults: chapterResults.slice(0, 6),
      momentResults: momentResults.slice(0, 10),
      matchChapterIds,
    };
  }, [chapterQuery, filteredChaptersByStatus]);

  const visibleChapters = useMemo(() => {
    if (!catalogSearch.query || !catalogSearch.matchChapterIds) {
      return filteredChaptersByStatus;
    }
    return filteredChaptersByStatus.filter((ch) =>
      catalogSearch.matchChapterIds?.has(ch.id),
    );
  }, [
    catalogSearch.matchChapterIds,
    catalogSearch.query,
    filteredChaptersByStatus,
  ]);

  const scrollToChapter = (chapterId: string) => {
    const el = chapterCardRefs.current[chapterId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleExpandedChapter = (chapterId: string) => {
    setExpandedChapterId((current) =>
      current === chapterId ? null : chapterId,
    );
  };

  const showSearchResultsPanel =
    viewMode === "chapters" && Boolean(chapterQuery.trim());

  const handleCreateAvulso = () => {
    navigate("/jornada/moment/avulso");
  };

  const handlePlaceholderClick = (templateId: string, templateKey: string) => {
    if (!selectedChild) {
      navigate("/perfil-usuario");
      return;
    }

    const canonicalKey = normalizeTemplateKey(templateKey) ?? templateKey;

    const related = moments
      .filter(
        (moment) => normalizeTemplateKey(moment.templateKey) === canonicalKey,
      )
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    const published = related.find((moment) => moment.status === "published");
    if (published) {
      navigate(`/jornada/moment/${published.id}`);
      return;
    }

    const draft = related.find((moment) => moment.status === "draft");
    if (draft) {
      navigate(`/jornada/moment/draft/${templateId}`);
      return;
    }

    navigate(`/jornada/moment/draft/${templateId}`);
  };

  const hasMoments = moments && moments.length > 0;

  const recurrenceMetaById = useMemo(() => {
    type RecurrenceMeta = {
      kind: "recurring" | "series";
      label: string;
      index: number;
      total: number;
    };

    const byId = new Map<string, RecurrenceMeta>();

    // Agrupa por template (normalizado) para calcular “registro #n de #total”.
    const groups = new Map<string, Moment[]>();
    for (const m of moments ?? []) {
      const canonicalKey =
        normalizeTemplateKey(m.templateKey) ?? m.templateKey ?? "";
      if (!canonicalKey) continue;
      if (!groups.has(canonicalKey)) groups.set(canonicalKey, []);
      groups.get(canonicalKey)!.push(m);
    }

    const getTime = (m: Moment) =>
      new Date(m.occurredAt ?? m.createdAt).getTime();

    for (const [canonicalKey, items] of groups.entries()) {
      const catalogInfo = getMomentByTemplateKey(canonicalKey);
      const type = catalogInfo?.type;
      if (type !== "recurring" && type !== "series") continue;

      const sorted = items.slice().sort((a, b) => getTime(a) - getTime(b));
      const total = sorted.length;
      sorted.forEach((m, idx) => {
        const index = idx + 1;
        byId.set(m.id, {
          kind: type,
          label: type === "recurring" ? "Recorrente" : "Série",
          index,
          total,
        });
      });
    }

    return byId;
  }, [moments]);

  const [expandedRecurrenceKeys, setExpandedRecurrenceKeys] = useState<
    Set<string>
  >(() => new Set());

  const toggleRecurrenceGroup = (canonicalTemplateKey: string) => {
    setExpandedRecurrenceKeys((prev) => {
      const next = new Set(prev);
      if (next.has(canonicalTemplateKey)) next.delete(canonicalTemplateKey);
      else next.add(canonicalTemplateKey);
      return next;
    });
  };

  type TimelineItem =
    | { kind: "moment"; moment: Moment }
    | {
        kind: "recurrence";
        canonicalTemplateKey: string;
        label: string;
        recurrenceKind: "recurring" | "series";
        latest: Moment;
        history: Moment[];
      };

  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!moments?.length) return [];

    const byCanonicalKey = new Map<string, Moment[]>();
    const singles: Moment[] = [];

    const canonicalOf = (m: Moment) =>
      normalizeTemplateKey(m.templateKey) ?? m.templateKey ?? "";

    const getTime = (m: Moment) =>
      new Date(m.occurredAt ?? m.createdAt).getTime();

    for (const m of moments) {
      const canonical = canonicalOf(m);
      const catalogMoment = canonical
        ? getMomentByTemplateKey(canonical)
        : null;
      const type = catalogMoment?.type;
      const isRecurring = type === "recurring" || type === "series";

      if (!isRecurring || !canonical) {
        singles.push(m);
        continue;
      }

      const arr = byCanonicalKey.get(canonical) ?? [];
      arr.push(m);
      byCanonicalKey.set(canonical, arr);
    }

    const items: TimelineItem[] = [];

    for (const m of singles) items.push({ kind: "moment", moment: m });

    for (const [canonicalTemplateKey, groupMoments] of byCanonicalKey) {
      const sortedDesc = groupMoments
        .slice()
        .sort((a, b) => getTime(b) - getTime(a));

      // Se só existe um registro, não vale “agrupamento premium” (mantém simples).
      if (sortedDesc.length <= 1) {
        items.push({ kind: "moment", moment: sortedDesc[0] });
        continue;
      }

      const latest = sortedDesc[0];
      const history = sortedDesc.slice(1);

      const catalogMoment = getMomentByTemplateKey(canonicalTemplateKey);
      const label = catalogMoment?.title ?? latest.title ?? "Momento";
      const recurrenceKind = (
        catalogMoment?.type === "series" ? "series" : "recurring"
      ) as "recurring" | "series";

      items.push({
        kind: "recurrence",
        canonicalTemplateKey,
        label,
        recurrenceKind,
        latest,
        history,
      });
    }

    items.sort((a, b) => {
      const aMoment = a.kind === "moment" ? a.moment : a.latest;
      const bMoment = b.kind === "moment" ? b.moment : b.latest;
      return getTime(bMoment) - getTime(aMoment);
    });

    return items;
  }, [moments]);

  const renderTimeline = () => {
    if (isLoading) {
      return (
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-3xl border shadow-sm"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            />
          ))}
        </div>
      );
    }

    if (!hasMoments) {
      return (
        <div
          className="mt-6 rounded-3xl border border-dashed p-6 md:p-8 text-center shadow-sm"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            Nenhum momento publicado ainda. Use o HUD ou crie um momento livre
            para iniciar a história.
          </p>
          <button
            onClick={handleCreateAvulso}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold transition-all duration-300 hover:shadow-md hover:bg-opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--bb-color-accent)",
              color: "var(--bb-color-surface)",
            }}
          >
            <Plus className="h-5 w-5" />
            Registrar primeiro momento
          </button>
        </div>
      );
    }

    return (
      <LayoutGroup id="journey-timeline-items">
        <div className="mt-6 space-y-4">
          {timelineItems.map((item) => {
            if (item.kind === "moment") {
              const moment = item.moment;
              return (
                <EnhancedMomentCard
                  key={moment.id}
                  moment={moment}
                  recurrence={recurrenceMetaById.get(moment.id) ?? null}
                />
              );
            }

            const expanded = expandedRecurrenceKeys.has(
              item.canonicalTemplateKey,
            );
            const historyCount = item.history.length;

            return (
              <motion.div
                layout
                key={`recurrence:${item.canonicalTemplateKey}`}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="min-w-0 text-xs font-semibold truncate"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                    title={item.label}
                  >
                    {item.recurrenceKind === "series" ? "Série" : "Recorrente"}:{" "}
                    {item.label}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleRecurrenceGroup(item.canonicalTemplateKey)
                    }
                    className={cn(
                      "shrink-0 text-xs font-semibold transition",
                      historyCount > 0
                        ? "hover:opacity-80 active:scale-[0.98]"
                        : "opacity-40 cursor-default",
                    )}
                    style={{ color: "var(--bb-color-accent)" }}
                    aria-expanded={expanded}
                    disabled={historyCount === 0}
                  >
                    {expanded
                      ? "Ocultar histórico"
                      : `Ver histórico (${historyCount})`}
                  </button>
                </div>

                <EnhancedMomentCard
                  moment={item.latest}
                  recurrence={recurrenceMetaById.get(item.latest.id) ?? null}
                />

                <AnimatePresence initial={false}>
                  {expanded && historyCount > 0 ? (
                    <motion.div
                      key={`history:${item.canonicalTemplateKey}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 40,
                        mass: 0.8,
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        layout
                        className="space-y-3 pl-3 border-l"
                        style={{ borderColor: "var(--bb-color-border)" }}
                      >
                        {item.history.map((m) => (
                          <EnhancedMomentCard
                            key={m.id}
                            moment={m}
                            compact
                            recurrence={recurrenceMetaById.get(m.id) ?? null}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>
    );
  };

  const renderChapters = () => {
    if (visibleChapters.length === 0) {
      return (
        <div
          className="mt-6 rounded-3xl border border-dashed p-6 md:p-8 text-center shadow-sm"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--bb-color-ink-muted)" }}>
            Nenhum capítulo encontrado com os filtros atuais.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setChapterQuery("");
                setChapterFilter("all");
              }}
              className="rounded-2xl border px-4 py-2 text-sm font-semibold transition"
              style={{
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink)",
              }}
            >
              Limpar filtros
            </button>
            <button
              type="button"
              onClick={() =>
                setChaptersLayout((l) => (l === "list" ? "grid" : "list"))
              }
              className="rounded-2xl border border-dashed px-4 py-2 text-sm font-semibold transition"
              style={{
                borderColor: "var(--bb-color-border)",
                color: "var(--bb-color-ink-muted)",
              }}
            >
              Alternar visualização
            </button>
          </div>
        </div>
      );
    }

    if (chaptersLayout === "grid") {
      return (
        <LayoutGroup id="journey-chapters-grid">
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {visibleChapters.map((chapter) => {
              const isExpanded = expandedChapterId === chapter.id;
              const status = chapterStatus(chapter.completed, chapter.total);
              const nextMoment = chapter.nextMoment;

              const statusStyles =
                status.tone === "success"
                  ? {
                      backgroundColor: "rgba(34, 197, 94, 0.12)",
                      color: "rgb(22, 163, 74)",
                      borderColor: "rgba(34, 197, 94, 0.28)",
                    }
                  : status.tone === "warning"
                    ? {
                        backgroundColor: "rgba(245, 158, 11, 0.12)",
                        color: "rgb(217, 119, 6)",
                        borderColor: "rgba(245, 158, 11, 0.28)",
                      }
                    : {
                        backgroundColor: "rgba(148, 163, 184, 0.12)",
                        color: "var(--bb-color-ink-muted)",
                        borderColor: "rgba(148, 163, 184, 0.28)",
                      };

              return (
                <motion.div
                  layout
                  key={chapter.id}
                  ref={(el) => {
                    chapterCardRefs.current[chapter.id] = el;
                  }}
                  className="rounded-3xl border p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-600"
                  style={{
                    backgroundColor: "var(--bb-color-surface)",
                    borderColor: "var(--bb-color-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="text-xs uppercase tracking-[0.3em]"
                        style={{ color: "var(--bb-color-ink-muted)" }}
                      >
                        {chapter.title}
                      </p>
                      <h4
                        className="mt-1 font-serif text-xl"
                        style={{ color: "var(--bb-color-ink)" }}
                      >
                        {chapter.subtitle}
                      </h4>
                    </div>

                    <span
                      className="shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                      style={statusStyles}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chapter.accent }}
                        aria-hidden
                      />
                      {status.label}
                    </span>
                  </div>

                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--bb-color-ink-muted)" }}
                  >
                    {chapter.range}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--bb-color-ink)" }}
                    >
                      {chapter.completed}
                      <span style={{ color: "var(--bb-color-ink-muted)" }}>
                        /{chapter.total}
                      </span>
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      {Math.round(chapter.progressPercent)}%
                    </p>
                  </div>
                  <div
                    className="mt-4 h-1.5 rounded-full"
                    style={{
                      backgroundColor: "var(--bb-color-muted)",
                      opacity: 0.4,
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: "var(--bb-color-accent)",
                        width: `${chapter.progressPercent}%`,
                      }}
                    />
                  </div>

                  {nextMoment ? (
                    <button
                      type="button"
                      onClick={() =>
                        handlePlaceholderClick(
                          nextMoment.id,
                          nextMoment.templateKey,
                        )
                      }
                      className="mt-4 w-full rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                      style={{
                        backgroundColor: "var(--bb-color-accent)",
                        color: "var(--bb-color-surface)",
                      }}
                    >
                      {status.key === "in_progress" ? "Continuar" : "Começar"} ·{" "}
                      {nextMoment.title}
                    </button>
                  ) : (
                    <div
                      className="mt-4 w-full rounded-2xl border px-4 py-2 text-center text-sm font-semibold"
                      style={{
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink-muted)",
                      }}
                    >
                      Capítulo completo
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpandedChapter(chapter.id)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition"
                      style={
                        isExpanded
                          ? {
                              backgroundColor: "var(--bb-color-ink)",
                              color: "var(--bb-color-surface)",
                              borderColor: "var(--bb-color-ink)",
                            }
                          : {
                              borderColor: "var(--bb-color-border)",
                              color: "var(--bb-color-ink)",
                            }
                      }
                    >
                      {isExpanded ? "Fechar" : "Ver momentos"}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded ? (
                      <motion.div
                        key={`chapter:${chapter.id}:moments`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 40,
                          mass: 0.8,
                        }}
                        className="overflow-hidden"
                      >
                        <motion.div layout className="mt-4 space-y-2">
                          {chapter.moments.slice(0, 4).map((template) => {
                            const canonical =
                              normalizeTemplateKey(template.templateKey) ??
                              template.templateKey;

                            const related = moments.filter(
                              (moment) =>
                                normalizeTemplateKey(moment.templateKey) ===
                                canonical,
                            );
                            const publishedCount = related.filter(
                              (moment) => moment.status === "published",
                            ).length;

                            const isDone = publishedCount > 0;
                            const StatusIcon = isDone ? CheckCircle2 : Circle;

                            return (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() =>
                                  handlePlaceholderClick(
                                    template.id,
                                    template.templateKey,
                                  )
                                }
                                className="w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-600 active:scale-[0.99]"
                                style={{
                                  backgroundColor: "var(--bb-color-surface)",
                                  borderColor: "var(--bb-color-border)",
                                }}
                                disabled={isLoading}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p
                                        className="text-xs uppercase tracking-[0.3em]"
                                        style={{
                                          color: "var(--bb-color-ink-muted)",
                                        }}
                                      >
                                        {template.type === "recurring"
                                          ? "Recorrente"
                                          : template.type === "series"
                                            ? "Série"
                                            : "Único"}
                                      </p>

                                      {template.id === "marcas-crescimento" ? (
                                        <span
                                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                                          style={{
                                            borderColor:
                                              "rgba(242,153,93,0.35)",
                                            background:
                                              "linear-gradient(135deg, rgba(242,153,93,0.18), rgba(168,85,247,0.14))",
                                            color: "var(--bb-color-ink)",
                                            boxShadow:
                                              "0 0 0 1px rgba(242,153,93,0.08) inset",
                                          }}
                                          title="Gerado por IA"
                                        >
                                          <Sparkles
                                            className="h-3 w-3"
                                            aria-hidden
                                          />
                                          IA
                                        </span>
                                      ) : null}
                                    </div>
                                    <p
                                      className="mt-0.5 font-semibold"
                                      style={{ color: "var(--bb-color-ink)" }}
                                    >
                                      {template.title}
                                    </p>
                                  </div>
                                  <span
                                    className="inline-flex items-center gap-2 text-xs"
                                    style={{
                                      color: "var(--bb-color-ink-muted)",
                                    }}
                                  >
                                    <StatusIcon className="h-4 w-4" />
                                    {publishedCount > 0
                                      ? template.type === "unique"
                                        ? "Feito"
                                        : `${publishedCount} registro(s)`
                                      : "Não iniciado"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}

                          {chapter.moments.length > 4 ? (
                            <p
                              className="px-1 text-xs"
                              style={{ color: "var(--bb-color-ink-muted)" }}
                            >
                              + {chapter.moments.length - 4} momento(s) no
                              capítulo
                            </p>
                          ) : null}
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </LayoutGroup>
      );
    }

    return (
      <LayoutGroup id="journey-chapters-list">
        <div className="mt-6 space-y-4">
          {visibleChapters.map((chapter) => {
            const isExpanded = expandedChapterId === chapter.id;
            const status = chapterStatus(chapter.completed, chapter.total);
            const nextMoment = chapter.nextMoment;

            const statusStyles =
              status.tone === "success"
                ? {
                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                    color: "rgb(22, 163, 74)",
                    borderColor: "rgba(34, 197, 94, 0.28)",
                  }
                : status.tone === "warning"
                  ? {
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      color: "rgb(217, 119, 6)",
                      borderColor: "rgba(245, 158, 11, 0.28)",
                    }
                  : {
                      backgroundColor: "rgba(148, 163, 184, 0.12)",
                      color: "var(--bb-color-ink-muted)",
                      borderColor: "rgba(148, 163, 184, 0.28)",
                    };

            return (
              <motion.div
                layout
                key={chapter.id}
                ref={(el) => {
                  chapterCardRefs.current[chapter.id] = el;
                }}
                className="rounded-3xl border p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-600"
                style={{
                  backgroundColor: "var(--bb-color-surface)",
                  borderColor: "var(--bb-color-border)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p
                      className="text-xs uppercase tracking-[0.3em]"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      {chapter.title}
                    </p>
                    <h4
                      className="mt-1 font-serif text-xl"
                      style={{ color: "var(--bb-color-ink)" }}
                    >
                      {chapter.subtitle}
                    </h4>
                    <p
                      className="text-sm"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    >
                      {chapter.range}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                      style={statusStyles}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: chapter.accent }}
                        aria-hidden
                      />
                      {status.label}
                    </span>
                    <div className="text-right">
                      <p
                        className="font-serif text-3xl"
                        style={{ color: "var(--bb-color-ink)" }}
                      >
                        {chapter.completed}
                        <span style={{ color: "var(--bb-color-ink-muted)" }}>
                          /{chapter.total}
                        </span>
                      </p>
                      <p
                        className="text-xs uppercase tracking-[0.3em]"
                        style={{ color: "var(--bb-color-ink-muted)" }}
                      >
                        momentos
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-4 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--bb-color-muted)",
                    opacity: 0.4,
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: "var(--bb-color-accent)",
                      width: `${chapter.progressPercent}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {nextMoment ? (
                    <button
                      type="button"
                      onClick={() =>
                        handlePlaceholderClick(
                          nextMoment.id,
                          nextMoment.templateKey,
                        )
                      }
                      className="rounded-2xl px-4 py-2 text-sm font-semibold transition hover:opacity-90"
                      style={{
                        backgroundColor: "var(--bb-color-accent)",
                        color: "var(--bb-color-surface)",
                      }}
                    >
                      {status.key === "in_progress" ? "Continuar" : "Começar"} ·{" "}
                      {nextMoment.title}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleExpandedChapter(chapter.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition hover:opacity-90 active:scale-[0.99]"
                    style={{
                      borderColor: "var(--bb-color-border)",
                      color: "var(--bb-color-ink)",
                      backgroundColor: "transparent",
                    }}
                  >
                    <span>
                      {isExpanded
                        ? "Esconder momentos"
                        : `Ver todos os momentos (${chapter.total})`}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 ease-out",
                        isExpanded ? "rotate-180" : "rotate-0",
                      )}
                      aria-hidden
                    />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.div
                      key={`chapter:${chapter.id}:moments`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 40,
                        mass: 0.8,
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div layout className="mt-5 space-y-3">
                        {chapter.moments.map((template) => {
                          const canonical =
                            normalizeTemplateKey(template.templateKey) ??
                            template.templateKey;

                          const related = moments.filter(
                            (moment) =>
                              normalizeTemplateKey(moment.templateKey) ===
                              canonical,
                          );
                          const publishedCount = related.filter(
                            (moment) => moment.status === "published",
                          ).length;

                          const isDone = publishedCount > 0;
                          const StatusIcon = isDone ? CheckCircle2 : Circle;

                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() =>
                                handlePlaceholderClick(
                                  template.id,
                                  template.templateKey,
                                )
                              }
                              className="w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-600 active:scale-[0.99]"
                              style={{
                                backgroundColor: "var(--bb-color-surface)",
                                borderColor: "var(--bb-color-border)",
                              }}
                              disabled={isLoading}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p
                                      className="text-xs uppercase tracking-[0.3em]"
                                      style={{
                                        color: "var(--bb-color-ink-muted)",
                                      }}
                                    >
                                      {template.type === "recurring"
                                        ? "Recorrente"
                                        : template.type === "series"
                                          ? "Série"
                                          : "Único"}
                                    </p>

                                    {template.id === "marcas-crescimento" ? (
                                      <span
                                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                                        style={{
                                          borderColor: "rgba(242,153,93,0.35)",
                                          background:
                                            "linear-gradient(135deg, rgba(242,153,93,0.18), rgba(168,85,247,0.14))",
                                          color: "var(--bb-color-ink)",
                                          boxShadow:
                                            "0 0 0 1px rgba(242,153,93,0.08) inset",
                                        }}
                                        title="Gerado por IA"
                                      >
                                        <Sparkles
                                          className="h-3 w-3"
                                          aria-hidden
                                        />
                                        IA
                                      </span>
                                    ) : null}
                                  </div>
                                  <p
                                    className="font-semibold"
                                    style={{ color: "var(--bb-color-ink)" }}
                                  >
                                    {template.title}
                                  </p>
                                </div>
                                <span
                                  className="text-xs"
                                  style={{ color: "var(--bb-color-ink-muted)" }}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <StatusIcon className="h-4 w-4" />
                                    {publishedCount > 0
                                      ? template.type === "unique"
                                        ? "Feito"
                                        : `${publishedCount} registro(s)`
                                      : "Não iniciado"}
                                  </span>
                                </span>
                              </div>
                              <p
                                className="mt-1 text-sm"
                                style={{ color: "var(--bb-color-ink-muted)" }}
                              >
                                {template.prompt}
                              </p>
                            </button>
                          );
                        })}
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>
    );
  };

  const renderHUD = () => {
    if (viewMode === "timeline") {
      return (
        <NextMomentSuggestion
          template={nextTemplate ?? null}
          childName={childName}
          hasBirthday={hasBirthday}
        />
      );
    }

    return <JourneyProgressCard completed={completedCount} />;
  };

  return (
    <section className="mb-12">
      <div className="mb-6">
        <div
          className="w-full rounded-2xl border p-1.5 shadow-sm"
          style={{
            backgroundColor: "var(--bb-color-surface)",
            borderColor: "var(--bb-color-border)",
          }}
        >
          <LayoutGroup id="journey-view-tabs">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "timeline", label: "Timeline", icon: History },
                { id: "chapters", label: "Capítulos", icon: BookOpen },
              ].map((tab) => {
                const isActive = viewMode === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewMode(tab.id as ViewMode)}
                    className={cn(
                      "relative flex-1 min-w-[140px] overflow-hidden rounded-2xl px-4 py-1.5 text-sm font-semibold transition-colors duration-300",
                    )}
                    style={{
                      color: isActive
                        ? "var(--bb-color-surface)"
                        : "var(--bb-color-ink-muted)",
                    }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="journey-view-pill"
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          backgroundColor: "var(--bb-color-accent)",
                          boxShadow: "0 8px 20px rgba(242,153,93,0.2)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center justify-center gap-2">
                      <Icon
                        className="h-4 w-4 transition-colors duration-300"
                        style={{
                          color: isActive
                            ? "var(--bb-color-surface)"
                            : "var(--bb-color-ink-muted)",
                        }}
                      />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
      </div>

      <div className="mt-6">{renderHUD()}</div>

      <div className="mt-6">
        {viewMode === "chapters" && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3
                  className="font-serif text-2xl"
                  style={{ color: "var(--bb-color-ink)" }}
                >
                  Capítulos
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--bb-color-ink-muted)" }}
                >
                  Explore a jornada por fases e continue exatamente de onde
                  parou.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setChaptersLayout("list")}
                  className="inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-semibold transition"
                  style={
                    chaptersLayout === "list"
                      ? {
                          backgroundColor: "var(--bb-color-ink)",
                          color: "var(--bb-color-surface)",
                          borderColor: "var(--bb-color-ink)",
                        }
                      : {
                          borderColor: "var(--bb-color-border)",
                          color: "var(--bb-color-ink)",
                        }
                  }
                >
                  <List className="h-4 w-4" />
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setChaptersLayout("grid")}
                  className="inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-sm font-semibold transition"
                  style={
                    chaptersLayout === "grid"
                      ? {
                          backgroundColor: "var(--bb-color-ink)",
                          color: "var(--bb-color-surface)",
                          borderColor: "var(--bb-color-ink)",
                        }
                      : {
                          borderColor: "var(--bb-color-border)",
                          color: "var(--bb-color-ink)",
                        }
                  }
                >
                  <Grid2X2 className="h-4 w-4" />
                  Grade
                </button>
              </div>
            </div>

            <div
              ref={filtersWrapRef}
              className="-mx-1"
              style={
                filtersPinned && filtersPinnedStyle
                  ? { height: filtersPinnedStyle.height }
                  : undefined
              }
            >
              <div ref={filtersSentinelRef} aria-hidden className="h-0" />

              <div
                className={
                  filtersPinned && filtersPinnedStyle
                    ? "fixed z-30 rounded-3xl border p-3 shadow-sm backdrop-blur"
                    : "sticky top-16 z-30 rounded-3xl border p-3 shadow-sm backdrop-blur"
                }
                style={{
                  backgroundColor: "var(--bb-color-surface)",
                  borderColor: "var(--bb-color-border)",
                  ...(filtersPinned && filtersPinnedStyle
                    ? {
                        top: filtersPinnedStyle.top,
                        left: filtersPinnedStyle.left,
                        width: filtersPinnedStyle.width,
                      }
                    : undefined),
                }}
              >
                <div className="space-y-3">
                  <div className="relative w-full">
                    <Search
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "var(--bb-color-ink-muted)" }}
                    />
                    <input
                      value={chapterQuery}
                      onChange={(e) => setChapterQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setChapterQuery("");
                        }
                      }}
                      placeholder="Buscar capítulo ou momento..."
                      className="w-full rounded-2xl border py-2 pl-10 pr-3 text-sm font-medium outline-none transition"
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                        color: "var(--bb-color-ink)",
                      }}
                    />
                  </div>

                  {showSearchResultsPanel ? (
                    <div
                      className="rounded-2xl border p-2"
                      style={{
                        backgroundColor: "var(--bb-color-surface)",
                        borderColor: "var(--bb-color-border)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 px-2 py-1">
                        <p
                          className="text-xs uppercase tracking-[0.3em]"
                          style={{ color: "var(--bb-color-ink-muted)" }}
                        >
                          Resultados
                        </p>
                        <button
                          type="button"
                          onClick={() => setChapterQuery("")}
                          className="rounded-xl border px-2 py-1 text-xs font-semibold transition"
                          style={{
                            borderColor: "var(--bb-color-border)",
                            color: "var(--bb-color-ink)",
                          }}
                        >
                          Limpar
                        </button>
                      </div>

                      <div
                        className="max-h-[50vh] overflow-y-auto overscroll-contain pr-1"
                        style={{ WebkitOverflowScrolling: "touch" }}
                      >
                        {catalogSearch.chapterResults.length === 0 &&
                        catalogSearch.momentResults.length === 0 ? (
                          <p
                            className="px-2 py-2 text-sm"
                            style={{ color: "var(--bb-color-ink-muted)" }}
                          >
                            Nenhum resultado para “{chapterQuery.trim()}”. Dica:
                            tente termos como “gravidez”, “parto”, “umbigo” ou
                            “dente”.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {catalogSearch.chapterResults.length > 0 ? (
                              <div>
                                <p
                                  className="px-2 pt-2 text-xs font-semibold"
                                  style={{ color: "var(--bb-color-ink-muted)" }}
                                >
                                  Capítulos
                                </p>
                                <div className="mt-1 space-y-1">
                                  {catalogSearch.chapterResults.map((r) => {
                                    const chapter =
                                      filteredChaptersByStatus.find(
                                        (c) => c.id === r.chapterId,
                                      );
                                    if (!chapter) return null;

                                    const highlightTokens = [
                                      chapterQuery,
                                      ...r.matchedTokens,
                                    ];

                                    return (
                                      <button
                                        key={`chapter-${chapter.id}`}
                                        type="button"
                                        onClick={() => {
                                          setExpandedChapterId(chapter.id);
                                          window.requestAnimationFrame(() =>
                                            scrollToChapter(chapter.id),
                                          );
                                        }}
                                        className="w-full rounded-2xl border px-3 py-2 text-left transition hover:shadow-sm"
                                        style={{
                                          backgroundColor:
                                            "var(--bb-color-surface)",
                                          borderColor: "var(--bb-color-border)",
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                                                style={{
                                                  borderColor:
                                                    "var(--bb-color-border)",
                                                  color:
                                                    "var(--bb-color-ink-muted)",
                                                }}
                                              >
                                                Capítulo
                                              </span>
                                              <span
                                                className="truncate font-semibold"
                                                style={{
                                                  color: "var(--bb-color-ink)",
                                                }}
                                              >
                                                {renderHighlightedText(
                                                  chapter.subtitle,
                                                  highlightTokens,
                                                )}
                                              </span>

                                              {!r.matchedExact ? (
                                                <span
                                                  className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                                                  style={{
                                                    borderColor:
                                                      "var(--bb-color-border)",
                                                    color:
                                                      "var(--bb-color-ink-muted)",
                                                  }}
                                                >
                                                  Sinônimo
                                                </span>
                                              ) : null}
                                            </div>
                                            <p
                                              className="mt-0.5 truncate text-xs"
                                              style={{
                                                color:
                                                  "var(--bb-color-ink-muted)",
                                              }}
                                            >
                                              {renderHighlightedText(
                                                `${chapter.title} · ${chapter.range}`,
                                                highlightTokens,
                                              )}
                                            </p>
                                          </div>
                                          <span
                                            className="shrink-0 h-2 w-2 rounded-full"
                                            style={{
                                              backgroundColor: chapter.accent,
                                            }}
                                            aria-hidden
                                          />
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}

                            {catalogSearch.momentResults.length > 0 ? (
                              <div>
                                <p
                                  className="px-2 pt-2 text-xs font-semibold"
                                  style={{ color: "var(--bb-color-ink-muted)" }}
                                >
                                  Momentos
                                </p>
                                <div className="mt-1 space-y-1">
                                  {catalogSearch.momentResults.map((r) => {
                                    const chapter =
                                      filteredChaptersByStatus.find(
                                        (c) => c.id === r.chapterId,
                                      );
                                    if (!chapter) return null;

                                    const highlightTokens = [
                                      chapterQuery,
                                      ...r.matchedTokens,
                                    ];

                                    return (
                                      <button
                                        key={`moment-${r.chapterId}-${r.template.id}`}
                                        type="button"
                                        onClick={() => {
                                          setExpandedChapterId(r.chapterId);
                                          window.requestAnimationFrame(() =>
                                            scrollToChapter(r.chapterId),
                                          );
                                          // Abrimos diretamente o momento (vazio -> draft; preenchido -> publicado)
                                          handlePlaceholderClick(
                                            r.template.id,
                                            r.template.templateKey,
                                          );
                                        }}
                                        className="w-full rounded-2xl border px-3 py-2 text-left transition hover:shadow-sm"
                                        style={{
                                          backgroundColor:
                                            "var(--bb-color-surface)",
                                          borderColor: "var(--bb-color-border)",
                                        }}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                                                style={{
                                                  borderColor:
                                                    "var(--bb-color-border)",
                                                  color:
                                                    "var(--bb-color-ink-muted)",
                                                }}
                                              >
                                                Momento
                                              </span>

                                              {r.template.id ===
                                              "marcas-crescimento" ? (
                                                <span
                                                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                                                  style={{
                                                    borderColor:
                                                      "rgba(242,153,93,0.35)",
                                                    background:
                                                      "linear-gradient(135deg, rgba(242,153,93,0.18), rgba(168,85,247,0.14))",
                                                    color:
                                                      "var(--bb-color-ink)",
                                                    boxShadow:
                                                      "0 0 0 1px rgba(242,153,93,0.08) inset",
                                                  }}
                                                  title="Gerado por IA"
                                                >
                                                  <Sparkles
                                                    className="h-3 w-3"
                                                    aria-hidden
                                                  />
                                                  IA
                                                </span>
                                              ) : null}

                                              <span
                                                className="truncate font-semibold"
                                                style={{
                                                  color: "var(--bb-color-ink)",
                                                }}
                                              >
                                                {renderHighlightedText(
                                                  r.template.title,
                                                  highlightTokens,
                                                )}
                                              </span>

                                              {!r.matchedExact ? (
                                                <span
                                                  className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.25em]"
                                                  style={{
                                                    borderColor:
                                                      "var(--bb-color-border)",
                                                    color:
                                                      "var(--bb-color-ink-muted)",
                                                  }}
                                                >
                                                  Sinônimo
                                                </span>
                                              ) : null}
                                            </div>
                                            <p
                                              className="mt-0.5 line-clamp-2 text-xs"
                                              style={{
                                                color:
                                                  "var(--bb-color-ink-muted)",
                                              }}
                                            >
                                              {renderHighlightedText(
                                                r.template.prompt,
                                                highlightTokens,
                                              )}
                                            </p>
                                          </div>
                                          <div className="shrink-0 text-right">
                                            <p
                                              className="text-[10px] font-bold uppercase tracking-[0.25em]"
                                              style={{
                                                color:
                                                  "var(--bb-color-ink-muted)",
                                              }}
                                            >
                                              em
                                            </p>
                                            <p
                                              className="text-xs"
                                              style={{
                                                color: "var(--bb-color-ink)",
                                              }}
                                            >
                                              {chapter.subtitle}
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "all", label: "Todos" },
                        { id: "todo", label: "Não iniciados" },
                        { id: "in_progress", label: "Em andamento" },
                        { id: "done", label: "Concluídos" },
                      ] as const
                    ).map((opt) => {
                      const active = chapterFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setChapterFilter(opt.id)}
                          className="rounded-2xl border px-3 py-1.5 text-sm font-semibold transition"
                          style={
                            active
                              ? {
                                  backgroundColor: "var(--bb-color-accent)",
                                  color: "var(--bb-color-surface)",
                                  borderColor: "var(--bb-color-accent)",
                                }
                              : {
                                  borderColor: "var(--bb-color-border)",
                                  color: "var(--bb-color-ink)",
                                }
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "timeline"
          ? renderTimeline()
          : isLoading
            ? null
            : renderChapters()}
      </div>
    </section>
  );
};

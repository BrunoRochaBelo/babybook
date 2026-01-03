import { useMemo } from "react";
import { Heart, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export type GuestbookFamilyTreeGraphNode = {
  key: string;
  label: string;
  count: number;
};

function hashToUnit(value: string): number {
  // Hash simples/determinístico → [0, 1)
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return (hash % 10_000) / 10_000;
}

export function GuestbookFamilyTreeGraph(props: {
  childName: string;
  nodes: GuestbookFamilyTreeGraphNode[];
  className?: string;
}) {
  const nodes = props.nodes;

  const layout = useMemo(() => {
    const cx = 180;
    const cy = 150;

    const n = Math.max(1, nodes.length);
    const ringRadius = n <= 4 ? 108 : n <= 7 ? 120 : 132;

    return nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / n - Math.PI / 2;

      const jx = (hashToUnit(node.key + ":x") - 0.5) * 14;
      const jy = (hashToUnit(node.key + ":y") - 0.5) * 14;

      const x = cx + ringRadius * Math.cos(angle) + jx;
      const y = cy + ringRadius * Math.sin(angle) + jy;

      const midX = (cx + x) / 2;
      const midY = (cy + y) / 2;
      const curve = (hashToUnit(node.key + ":c") - 0.5) * 26;
      const controlX = midX + curve * Math.cos(angle + Math.PI / 2);
      const controlY = midY + curve * Math.sin(angle + Math.PI / 2);

      return {
        ...node,
        x,
        y,
        controlX,
        controlY,
      };
    });
  }, [nodes]);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("w-full", props.className)}
      aria-label="Árvore genealógica (visualização gráfica)"
    >
      <svg
        viewBox="0 0 360 300"
        className="w-full h-[260px] sm:h-[300px]"
        role="img"
        aria-label={`Árvore genealógica de ${props.childName}`}
      >
        <defs>
          <filter
            id="bb-softShadow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="10"
              floodColor="#000"
              floodOpacity="0.12"
            />
          </filter>

          <linearGradient id="bb-core" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F2995D" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F2995D" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Conexões */}
        {layout.map((node) => (
          <path
            key={`edge-${node.key}`}
            d={`M 180 150 Q ${node.controlX.toFixed(2)} ${node.controlY.toFixed(2)} ${node.x.toFixed(2)} ${node.y.toFixed(2)}`}
            fill="none"
            stroke="var(--bb-color-accent)"
            strokeOpacity="0.22"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}

        {/* Núcleo (criança) */}
        <g filter="url(#bb-softShadow)">
          <circle
            cx="180"
            cy="150"
            r="44"
            fill="url(#bb-core)"
            stroke="var(--bb-color-accent)"
            strokeOpacity="0.25"
          />
          <circle
            cx="180"
            cy="150"
            r="34"
            fill="var(--bb-color-surface)"
            stroke="var(--bb-color-border)"
          />
        </g>

        <foreignObject x="146" y="116" width="68" height="68">
          <div className="h-full w-full flex items-center justify-center">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--bb-color-accent-soft)",
                color: "var(--bb-color-accent)",
              }}
            >
              <Heart className="h-5 w-5" />
            </div>
          </div>
        </foreignObject>

        <text
          x="180"
          y="210"
          textAnchor="middle"
          fontSize="11"
          fill="var(--bb-color-ink-muted)"
        >
          {props.childName}
        </text>

        {/* Nós */}
        {layout.map((node) => {
          const bubble = 22 + Math.min(10, node.count) * 1.2;
          const label =
            node.label.length > 12 ? `${node.label.slice(0, 11)}…` : node.label;

          return (
            <g key={node.key} filter="url(#bb-softShadow)">
              <circle
                cx={node.x}
                cy={node.y}
                r={bubble}
                fill="var(--bb-color-surface)"
                stroke="var(--bb-color-border)"
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={bubble - 3}
                fill="var(--bb-color-bg)"
                stroke="var(--bb-color-accent)"
                strokeOpacity="0.16"
              />

              <text
                x={node.x}
                y={node.y - 2}
                textAnchor="middle"
                fontSize="13"
                fontWeight={800}
                fill="var(--bb-color-ink)"
              >
                {node.count}
              </text>
              <text
                x={node.x}
                y={node.y + 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight={700}
                fill="var(--bb-color-ink-muted)"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Brilhos */}
        <g opacity="0.55">
          <circle
            cx="56"
            cy="76"
            r="4"
            fill="var(--bb-color-accent)"
            fillOpacity="0.18"
          />
          <circle
            cx="312"
            cy="58"
            r="6"
            fill="var(--bb-color-accent)"
            fillOpacity="0.12"
          />
          <circle
            cx="318"
            cy="250"
            r="5"
            fill="var(--bb-color-accent)"
            fillOpacity="0.10"
          />
          <circle
            cx="40"
            cy="240"
            r="6"
            fill="var(--bb-color-accent)"
            fillOpacity="0.10"
          />
        </g>
      </svg>

      <div
        className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold"
        style={{ color: "var(--bb-color-ink-muted)" }}
      >
        <Sparkles className="h-3 w-3" />
        Um mapa afetivo gerado a partir das mensagens aprovadas
      </div>
    </div>
  );
}

/**
 * Dashboard Skeleton
 *
 * Skeleton de carregamento para a página Jornada (Dashboard B2C).
 * Segue o layout da página com placeholders animados.
 * Usa variáveis CSS para suportar dark mode.
 */

export function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-pulse">
      {/* Title */}
      <div className="mb-6 flex justify-center">
        <div
          className="h-9 w-32 rounded-lg"
          style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.3 }}
        />
      </div>

      {/* Child Selector */}
      <div className="mb-6 flex justify-center">
        <div
          className="h-12 w-full max-w-sm rounded-2xl"
          style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.2 }}
        />
      </div>

      {/* HUD Card */}
      <div
        className="rounded-2xl shadow-lg p-6 mb-6 border"
        style={{
          backgroundColor: "var(--bb-color-surface)",
          borderColor: "var(--bb-color-border)",
        }}
      >
        <div
          className="h-7 w-32 rounded mb-2"
          style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.3 }}
        />
        <div
          className="h-4 w-24 rounded mb-4"
          style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.2 }}
        />

        {/* Template Card */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ backgroundColor: "var(--bb-color-accent)", opacity: 0.2 }}
        >
          <div
            className="h-5 w-28 rounded mb-2"
            style={{ backgroundColor: "var(--bb-color-accent)", opacity: 0.3 }}
          />
          <div
            className="h-4 w-48 rounded mb-4"
            style={{ backgroundColor: "var(--bb-color-accent)", opacity: 0.2 }}
          />
          <div
            className="h-10 w-28 rounded-2xl"
            style={{ backgroundColor: "var(--bb-color-surface)", opacity: 0.5 }}
          />
        </div>

        <div
          className="h-3 w-64 rounded"
          style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.2 }}
        />
      </div>

      {/* Moments Section */}
      <div className="mb-8">
        <div
          className="h-6 w-36 rounded mb-4"
          style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.3 }}
        />

        {/* Moment Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl h-32 shadow-md border"
              style={{
                backgroundColor: "var(--bb-color-surface)",
                borderColor: "var(--bb-color-border)",
              }}
            >
              <div className="p-4 flex gap-4">
                <div
                  className="w-24 h-24 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.2 }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-5 w-32 rounded"
                    style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.3 }}
                  />
                  <div
                    className="h-4 w-full rounded"
                    style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.2 }}
                  />
                  <div
                    className="h-4 w-2/3 rounded"
                    style={{ backgroundColor: "var(--bb-color-muted)", opacity: 0.2 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

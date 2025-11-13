import { ArrowLeft, Syringe, TrendingUp, Check, Clock } from "lucide-react";
import { motion } from "motion/react";

interface HealthModuleProps {
  babyName: string;
  onBack: () => void;
  onNavigate?: (section: "memories" | "health" | "visits") => void;
}

export function HealthModule({ babyName, onBack }: HealthModuleProps) {
  const growthData = [
    { age: "Nasc", weight: 3.2, height: 49, percentile: 50 },
    { age: "1m", weight: 4.1, height: 53, percentile: 55 },
    { age: "2m", weight: 5.3, height: 57, percentile: 60 },
    { age: "3m", weight: 6.2, height: 60, percentile: 62 },
    { age: "6m", weight: 7.8, height: 67, percentile: 58 },
    { age: "10m", weight: 9.2, height: 74, percentile: 54 },
  ];

  const vaccines = [
    {
      age: "Ao nascer",
      items: [
        { name: "BCG", status: "completed" as const, date: "10/02/2024" },
        {
          name: "Hepatite B",
          status: "completed" as const,
          date: "10/02/2024",
        },
      ],
    },
    {
      age: "2 meses",
      items: [
        {
          name: "Pentavalente (1ª dose)",
          status: "completed" as const,
          date: "10/04/2024",
        },
        {
          name: "VIP (1ª dose)",
          status: "completed" as const,
          date: "10/04/2024",
        },
        {
          name: "Rotavírus (1ª dose)",
          status: "completed" as const,
          date: "10/04/2024",
        },
        {
          name: "Pneumocócica (1ª dose)",
          status: "completed" as const,
          date: "10/04/2024",
        },
      ],
    },
    {
      age: "4 meses",
      items: [
        {
          name: "Pentavalente (2ª dose)",
          status: "completed" as const,
          date: "10/06/2024",
        },
        {
          name: "VIP (2ª dose)",
          status: "completed" as const,
          date: "10/06/2024",
        },
        {
          name: "Rotavírus (2ª dose)",
          status: "completed" as const,
          date: "10/06/2024",
        },
        {
          name: "Pneumocócica (2ª dose)",
          status: "completed" as const,
          date: "10/06/2024",
        },
      ],
    },
    {
      age: "6 meses",
      items: [
        {
          name: "Pentavalente (3ª dose)",
          status: "scheduled" as const,
          date: undefined,
        },
        {
          name: "VIP (3ª dose)",
          status: "scheduled" as const,
          date: undefined,
        },
        {
          name: "Influenza (1ª dose)",
          status: "pending" as const,
          date: undefined,
        },
      ],
    },
  ];

  const totalVaccines = vaccines.reduce(
    (acc, group) => acc + group.items.length,
    0,
  );
  const completedVaccines = vaccines.reduce(
    (acc, group) =>
      acc + group.items.filter((v) => v.status === "completed").length,
    0,
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <button
            onClick={onBack}
            className="mb-3 -ml-2 h-9 flex items-center gap-2 text-sm hover:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-2xl sm:text-3xl font-serif mb-2">
            Saúde de {babyName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acompanhe vacinas e crescimento
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg mb-1">
                  Calendário de Vacinação
                </h3>
                <p className="text-sm text-muted-foreground">
                  {completedVaccines} de {totalVaccines} vacinas aplicadas
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl text-primary font-semibold">
                  {Math.round((completedVaccines / totalVaccines) * 100)}%
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${(completedVaccines / totalVaccines) * 100}%`,
                }}
              />
            </div>
          </motion.div>

          {/* Vaccines by Age */}
          <div className="space-y-4">
            {vaccines.map((group, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 rounded-3xl border border-border/50 bg-card/50"
              >
                <h4 className="font-serif text-lg mb-4">{group.age}</h4>
                <div className="space-y-3">
                  {group.items.map((vaccine) => (
                    <div
                      key={vaccine.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            vaccine.status === "completed"
                              ? "bg-primary text-white"
                              : vaccine.status === "scheduled"
                                ? "bg-accent/20"
                                : "bg-muted/20"
                          }`}
                        >
                          {vaccine.status === "completed" && (
                            <Check className="w-3 h-3" />
                          )}
                          {vaccine.status === "scheduled" && (
                            <Clock className="w-3 h-3 text-accent" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm">{vaccine.name}</p>
                          {vaccine.date && (
                            <p className="text-xs text-muted-foreground">
                              {vaccine.date}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          vaccine.status === "completed"
                            ? "bg-primary/10 text-primary"
                            : vaccine.status === "scheduled"
                              ? "bg-accent/10 text-accent"
                              : "bg-muted/10 text-muted-foreground"
                        }`}
                      >
                        {vaccine.status === "completed"
                          ? "Completo"
                          : vaccine.status === "scheduled"
                            ? "Agendado"
                            : "Pendente"}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Growth Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="p-6 rounded-3xl border border-border/50 bg-card/50"
          >
            <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Crescimento
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 text-muted-foreground">
                      Idade
                    </th>
                    <th className="text-right py-2 text-muted-foreground">
                      Peso (kg)
                    </th>
                    <th className="text-right py-2 text-muted-foreground">
                      Altura (cm)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {growthData.map((row) => (
                    <tr
                      key={row.age}
                      className="border-b border-border/10 hover:bg-muted/10"
                    >
                      <td className="py-2">{row.age}</td>
                      <td className="text-right">{row.weight}</td>
                      <td className="text-right">{row.height}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

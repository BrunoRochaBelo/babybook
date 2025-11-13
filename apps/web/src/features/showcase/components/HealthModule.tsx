import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ArrowLeft, Syringe, TrendingUp, Check, Clock, Calendar, Plus } from "lucide-react";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FloatingNav } from "./FloatingNav";

interface HealthModuleProps {
  babyName: string;
  onBack: () => void;
  onNavigate?: (section: 'memories' | 'health' | 'visits') => void;
}

type VaccineStatus = "completed" | "scheduled" | "pending";

interface VaccineItem {
  name: string;
  status: VaccineStatus;
  date?: string;
}

interface VaccineGroup {
  age: string;
  items: VaccineItem[];
}

export function HealthModule({ babyName, onBack, onNavigate }: HealthModuleProps) {
  // Mock growth data
  const growthData = [
    { age: "Nasc", weight: 3.2, height: 49, percentileWeight: 50, percentileHeight: 50 },
    { age: "1m", weight: 4.1, height: 53, percentileWeight: 55, percentileHeight: 52 },
    { age: "2m", weight: 5.3, height: 57, percentileWeight: 60, percentileHeight: 55 },
    { age: "3m", weight: 6.2, height: 60, percentileWeight: 62, percentileHeight: 58 },
    { age: "4m", weight: 6.8, height: 63, percentileWeight: 60, percentileHeight: 60 },
    { age: "6m", weight: 7.8, height: 67, percentileWeight: 58, percentileHeight: 62 },
    { age: "9m", weight: 8.9, height: 72, percentileWeight: 55, percentileHeight: 60 },
    { age: "10m", weight: 9.2, height: 74, percentileWeight: 54, percentileHeight: 58 }
  ];

  const vaccines: VaccineGroup[] = [
    {
      age: "Ao nascer",
      items: [
        { name: "BCG", status: "completed", date: "10/02/2024" },
        { name: "Hepatite B", status: "completed", date: "10/02/2024" }
      ]
    },
    {
      age: "2 meses",
      items: [
        { name: "Pentavalente (1ª dose)", status: "completed", date: "10/04/2024" },
        { name: "VIP (1ª dose)", status: "completed", date: "10/04/2024" },
        { name: "Rotavírus (1ª dose)", status: "completed", date: "10/04/2024" },
        { name: "Pneumocócica (1ª dose)", status: "completed", date: "10/04/2024" }
      ]
    },
    {
      age: "3 meses",
      items: [
        { name: "Meningocócica C (1ª dose)", status: "completed", date: "10/05/2024" }
      ]
    },
    {
      age: "4 meses",
      items: [
        { name: "Pentavalente (2ª dose)", status: "completed", date: "10/06/2024" },
        { name: "VIP (2ª dose)", status: "completed", date: "10/06/2024" },
        { name: "Rotavírus (2ª dose)", status: "completed", date: "10/06/2024" },
        { name: "Pneumocócica (2ª dose)", status: "completed", date: "10/06/2024" }
      ]
    },
    {
      age: "5 meses",
      items: [
        { name: "Meningocócica C (2ª dose)", status: "scheduled", date: "10/07/2024" }
      ]
    },
    {
      age: "6 meses",
      items: [
        { name: "Pentavalente (3ª dose)", status: "pending" },
        { name: "VIP (3ª dose)", status: "pending" },
        { name: "Influenza (1ª dose)", status: "pending" }
      ]
    }
  ];

  const totalVaccines = vaccines.reduce((acc, group) => acc + group.items.length, 0);
  const completedVaccines = vaccines.reduce((acc, group) => 
    acc + group.items.filter(v => v.status === 'completed').length, 0
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="mb-3 -ml-2 h-9"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl sm:text-3xl mb-2">Saúde de {babyName}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Acompanhe vacinas e crescimento
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <Tabs defaultValue="vaccines" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12 rounded-2xl">
            <TabsTrigger value="vaccines" className="rounded-xl text-sm sm:text-base">
              <Syringe className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Vacinas</span>
              <span className="xs:hidden">Vacina</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="rounded-xl text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
              Crescimento
            </TabsTrigger>
          </TabsList>

          {/* Vaccines Tab */}
          <TabsContent value="vaccines" className="space-y-6">
            {/* Progress Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="mb-1">Calendário de Vacinação</h3>
                  <p className="text-sm text-muted-foreground">
                    {completedVaccines} de {totalVaccines} vacinas aplicadas
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl text-primary">{Math.round((completedVaccines / totalVaccines) * 100)}%</div>
                  <div className="text-xs text-muted-foreground">Completo</div>
                </div>
              </div>
              <Progress value={(completedVaccines / totalVaccines) * 100} className="h-2" />
            </Card>

            {/* Vaccine List by Age */}
            <div className="space-y-4">
              {vaccines.map((group, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-6">
                    <h4 className="mb-4">{group.age}</h4>
                    <div className="space-y-3">
                      {group.items.map((vaccine, vIndex) => (
                        <div 
                          key={vIndex}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                        >
                          <div className="flex-shrink-0">
                            {vaccine.status === 'completed' ? (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Check className="w-5 h-5 text-primary" />
                              </div>
                            ) : vaccine.status === 'scheduled' ? (
                              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-accent" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                <Clock className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={vaccine.status === 'completed' ? 'text-muted-foreground' : ''}>
                                {vaccine.name}
                              </span>
                              {vaccine.status === 'scheduled' && (
                                <Badge variant="secondary" className="text-xs">Agendada</Badge>
                              )}
                            </div>
                            {vaccine.date && (
                              <span className="text-xs text-muted-foreground">
                                {vaccine.status === 'completed' ? 'Aplicada' : 'Agendada'}: {vaccine.date}
                              </span>
                            )}
                          </div>
                          {vaccine.status === 'pending' && (
                            <Button size="sm" variant="outline" className="rounded-xl">
                              Marcar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Upload Vaccine Card */}
            <Card className="p-6 text-center border-dashed">
              <Syringe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="mb-2">Carteirinha de Vacinação</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Tire uma foto da carteirinha para manter tudo organizado
              </p>
              <Button variant="outline" className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Foto da Carteirinha
              </Button>
            </Card>
          </TabsContent>

          {/* Growth Tab */}
          <TabsContent value="growth" className="space-y-6">
            {/* Current Stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Peso Atual</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl mb-1">9.2 kg</div>
                <div className="text-xs text-muted-foreground">Percentil 54 (OMS)</div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Altura Atual</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="text-3xl mb-1">74 cm</div>
                <div className="text-xs text-muted-foreground">Percentil 58 (OMS)</div>
              </Card>
            </div>

            {/* Weight Chart */}
            <Card className="p-6">
              <h4 className="mb-4">Curva de Peso</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="age" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <ReferenceLine y={5} stroke="#E8845C" strokeDasharray="3 3" label="P50" />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#E8845C" 
                    strokeWidth={3}
                    dot={{ fill: '#E8845C', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Height Chart */}
            <Card className="p-6">
              <h4 className="mb-4">Curva de Altura</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="age" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'cm', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <ReferenceLine y={60} stroke="#C8D5C4" strokeDasharray="3 3" label="P50" />
                  <Line 
                    type="monotone" 
                    dataKey="height" 
                    stroke="#C8D5C4" 
                    strokeWidth={3}
                    dot={{ fill: '#C8D5C4', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Add Measurement */}
            <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Nova Medição
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {onNavigate && (
        <FloatingNav 
          activeSection="health"
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

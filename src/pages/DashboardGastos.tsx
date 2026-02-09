import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingDown, Calendar } from 'lucide-react';
import { api, ExpenseCategory } from '@/lib/api';
import { useBranch } from '@/contexts/BranchContext';

type Period = 'today' | 'week' | 'month' | 'custom';

interface ExpenseSummary {
  totalExpenses: number;
  categoryTotals: Record<ExpenseCategory, number>;
  period: {
    start: string;
    end: string;
  };
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredients: "Ingredientes",
  supplies: "Suministros",
  utilities: "Servicios (Luz, Agua, Gas)",
  rent: "Renta",
  salaries: "Salarios",
  other: "Otro",
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  ingredients: "bg-green-500",
  supplies: "bg-yellow-500",
  utilities: "bg-blue-500",
  rent: "bg-purple-500",
  salaries: "bg-red-500",
  other: "bg-gray-500",
};

export default function DashboardGastos() {
  const { selectedBranch } = useBranch();
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadExpensesSummary();
  }, [selectedBranch, period]);

  useEffect(() => {
    if (period === 'custom' && customStartDate && customEndDate) {
      loadExpensesSummary();
    }
  }, [customStartDate, customEndDate]);

  const loadExpensesSummary = async () => {
    try {
      setLoading(true);
      const params: any = { period };
      if (period === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const data = await api.getExpensesSummary(selectedBranch?.id, params);
      setSummary(data);
    } catch (error) {
      console.error('Error loading expense summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setShowCustomDatePicker(false);
    } else {
      setShowCustomDatePicker(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Gastos</h1>
          <p className="mt-2 text-muted-foreground">
            Análisis de gastos por categoría
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('today')}
          >
            Hoy
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('week')}
          >
            Última Semana
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('month')}
          >
            Último Mes
          </Button>
          <Button
            variant={period === 'custom' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('custom')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Personalizado
          </Button>
        </div>

        {showCustomDatePicker && (
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Fecha Inicio</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Fecha Fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando estadísticas...</div>
          </div>
        ) : summary ? (
          <>
            {/* Period Info */}
            <div className="mb-6 text-sm text-muted-foreground">
              Período: {formatDate(summary.period.start)} - {formatDate(summary.period.end)}
            </div>

            {/* Total Card */}
            <div className="mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Gastos
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    ${summary.totalExpenses.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            {summary.totalExpenses > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Desglose por Categoría</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribución del gasto en el período seleccionado
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(summary.categoryTotals)
                      .filter(([_, amount]) => amount > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount]) => {
                        const percentage = (amount / summary.totalExpenses) * 100;
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-3 w-3 rounded-full ${
                                    CATEGORY_COLORS[category as ExpenseCategory]
                                  }`}
                                />
                                <span className="font-medium">
                                  {CATEGORY_LABELS[category as ExpenseCategory]}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">
                                  {percentage.toFixed(1)}%
                                </span>
                                <span className="font-bold">
                                  ${amount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full transition-all ${
                                  CATEGORY_COLORS[category as ExpenseCategory]
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {summary.totalExpenses === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No hay gastos registrados en este período
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">No se pudieron cargar las estadísticas</div>
          </div>
        )}
      </div>
    </Layout>
  );
}

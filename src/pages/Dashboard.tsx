import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ShoppingCart, Package, TrendingUp, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useBranch } from '@/contexts/BranchContext';

type Period = 'today' | 'week' | 'month' | 'custom';

interface DashboardStats {
  period: string;
  startDate: string;
  endDate: string;
  totalSales: string;
  orders: number;
  productsSold: number;
  avgTicket: string;
  topProducts: { name: string; sales: number }[];
  topCombos: { name: string; sales: number }[];
}

export default function Dashboard() {
  const { selectedBranch } = useBranch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'combos'>('products');
  const [period, setPeriod] = useState<Period>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, [selectedBranch, period]);

  useEffect(() => {
    if (period === 'custom' && customStartDate && customEndDate) {
      loadDashboardStats();
    }
  }, [customStartDate, customEndDate]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const params: any = { period };
      if (period === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const data = await api.getDashboardStats(selectedBranch?.id, params);
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  const handleStartDateChange = (newStartDate: string) => {
    setCustomStartDate(newStartDate);
    // If end date exists and is before the new start date, update it
    if (customEndDate && newStartDate > customEndDate) {
      setCustomEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    setCustomEndDate(newEndDate);
    // If start date exists and is after the new end date, update it
    if (customStartDate && newEndDate < customStartDate) {
      setCustomStartDate(newEndDate);
    }
  };

  const dashboardCards = stats ? [
    {
      title: 'Ventas Totales',
      value: `$${stats.totalSales}`,
      icon: DollarSign,
    },
    {
      title: 'Órdenes',
      value: stats.orders.toString(),
      icon: ShoppingCart,
    },
    {
      title: 'Productos Vendidos',
      value: stats.productsSold.toLocaleString(),
      icon: Package,
    },
    {
      title: 'Ticket Promedio',
      value: `$${stats.avgTicket}`,
      icon: TrendingUp,
    },
  ] : [];

  const periodLabels: Record<Period, string> = {
    today: 'Hoy',
    week: 'Esta Semana',
    month: 'Este Mes',
    custom: 'Personalizado',
  };

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Resumen de ventas y estadísticas del negocio
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {(['today', 'week', 'month'] as Period[]).map((p) => (
                <Button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  variant={period === p ? 'default' : 'outline'}
                  size="sm"
                >
                  {periodLabels[p]}
                </Button>
              ))}
              <Button
                onClick={() => handlePeriodChange('custom')}
                variant={period === 'custom' ? 'default' : 'outline'}
                size="sm"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {periodLabels['custom']}
              </Button>
            </div>

            {showCustomDatePicker && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  max={customEndDate || undefined}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={customStartDate || undefined}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          
          {stats && (
            <p className="text-sm text-muted-foreground">
              {period === 'today' ? (
                <>
                  Mostrando datos de {new Date(stats.startDate).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </>
              ) : (
                <>
                  Mostrando datos desde {new Date(stats.startDate).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })} hasta {new Date(stats.endDate).toLocaleDateString('es-MX', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </>
              )}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando estadísticas...</div>
          </div>
        ) : stats ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {dashboardCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {card.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4 border-b pb-3">
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`pb-2 text-sm font-medium transition-colors ${
                        activeTab === 'products'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Productos
                    </button>
                    <button
                      onClick={() => setActiveTab('combos')}
                      className={`pb-2 text-sm font-medium transition-colors ${
                        activeTab === 'combos'
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Combos
                    </button>
                  </div>
                  <div className="mt-4">
                    <CardTitle>
                      {activeTab === 'products' ? 'Productos Más Vendidos' : 'Combos Más Vendidos'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Top 5 del período seleccionado
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === 'products' ? (
                    <div className="space-y-4">
                      {stats.topProducts.length > 0 ? (
                        stats.topProducts.map((product, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{product.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {product.sales} vendidos
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No hay datos disponibles
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.topCombos.length > 0 ? (
                        stats.topCombos.map((combo, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{combo.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {combo.sales} vendidos
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No hay datos disponibles
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
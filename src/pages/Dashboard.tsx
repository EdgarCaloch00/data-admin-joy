import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useBranch } from '@/contexts/BranchContext';

interface DashboardStats {
  totalSales: { value: string; change: string; positive: boolean };
  orders: { value: number; change: string; positive: boolean };
  productsSold: { value: number; change: string; positive: boolean };
  avgTicket: { value: string; change: string; positive: boolean };
  salesByDay: number[];
  topProducts: { name: string; sales: number }[];
}

export default function Dashboard() {
  const { selectedBranch } = useBranch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, [selectedBranch]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats(selectedBranch?.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = stats ? [
    {
      title: 'Ventas Totales',
      value: `$${stats.totalSales.value}`,
      change: `${stats.totalSales.positive ? '+' : ''}${stats.totalSales.change}% vs mes anterior`,
      icon: DollarSign,
      positive: stats.totalSales.positive,
    },
    {
      title: 'Órdenes',
      value: stats.orders.value.toString(),
      change: `${stats.orders.positive ? '+' : ''}${stats.orders.change}% vs mes anterior`,
      icon: ShoppingCart,
      positive: stats.orders.positive,
    },
    {
      title: 'Productos Vendidos',
      value: stats.productsSold.value.toLocaleString(),
      change: `${stats.productsSold.positive ? '+' : ''}${stats.productsSold.change}% vs mes anterior`,
      icon: Package,
      positive: stats.productsSold.positive,
    },
    {
      title: 'Ticket Promedio',
      value: `$${stats.avgTicket.value}`,
      change: `${stats.avgTicket.positive ? '+' : ''}${stats.avgTicket.change}% vs mes anterior`,
      icon: TrendingUp,
      positive: stats.avgTicket.positive,
    },
  ] : [];

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Resumen de ventas y estadísticas del negocio
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Cargando estadísticas...</div>
          </div>
        ) : stats ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {dashboardCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <p
                        className={`mt-2 text-xs ${
                          stat.positive ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Día</CardTitle>
                  <p className="text-sm text-muted-foreground">Últimos 7 días</p>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-end justify-between gap-2">
                    {stats.salesByDay.map((value, i) => {
                      const maxValue = Math.max(...stats.salesByDay, 1);
                      return (
                        <div key={i} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className="w-full rounded-t-md bg-primary"
                            style={{ height: `${(value / maxValue) * 100}%` }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                  <p className="text-sm text-muted-foreground">Top 5 de la semana</p>
                </CardHeader>
                <CardContent>
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
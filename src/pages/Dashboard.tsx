import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      title: 'Ventas Totales',
      value: '$44,150',
      change: '+20.1% vs mes anterior',
      icon: DollarSign,
      positive: true,
    },
    {
      title: 'Órdenes',
      value: '441',
      change: '+15.3% vs mes anterior',
      icon: ShoppingCart,
      positive: true,
    },
    {
      title: 'Productos Vendidos',
      value: '1,234',
      change: '+12.5% vs mes anterior',
      icon: Package,
      positive: true,
    },
    {
      title: 'Ticket Promedio',
      value: '$100.11',
      change: '+4.2% vs mes anterior',
      icon: TrendingUp,
      positive: true,
    },
  ];

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Resumen de ventas y estadísticas del negocio
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
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
                {[6200, 7800, 5400, 8900, 7200, 6800, 9100].map((value, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-primary"
                      style={{ height: `${(value / 10000) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                    </span>
                  </div>
                ))}
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
                {[
                  { name: 'Crepa Nutella', sales: 1234 },
                  { name: 'Crepa Fresa', sales: 987 },
                  { name: 'Café Latte', sales: 856 },
                  { name: 'Crepa Cajeta', sales: 743 },
                  { name: 'Crepa Jamón y Queso', sales: 621 },
                ].map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.sales} vendidos
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

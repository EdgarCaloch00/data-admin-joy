import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, Calendar, Filter } from 'lucide-react';
import { api, ExpenseCategory, Expense } from '@/lib/api';
import { useBranch } from '@/contexts/BranchContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Period = 'today' | 'week' | 'month' | 'custom';

interface ExpenseSummary {
  totalExpenses: number;
  categoryTotals: { [key: string]: number };
  subcategoryTotals: { [key: string]: number };
  period: {
    start: string;
    end: string;
  };
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
  'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500'
];

export default function DashboardGastos() {
  const { selectedBranch } = useBranch();
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string>('all');

  useEffect(() => {
    loadCategories();
  }, [selectedBranch]);

  useEffect(() => {
    loadExpensesSummary();
    loadExpenses();
  }, [selectedBranch, period, filterCategoryId, filterSubcategoryId]);

  useEffect(() => {
    if (period === 'custom' && customStartDate && customEndDate) {
      loadExpensesSummary();
      loadExpenses();
    }
  }, [customStartDate, customEndDate]);

  const loadCategories = async () => {
    try {
      const data = await api.getExpenseCategories();
      const filterByBranch = data.filter(
        (cat: ExpenseCategory) => cat.branch_id === selectedBranch?.id
      );
      setCategories(filterByBranch);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses();
      let filtered = data.filter(
        (expense: Expense) => expense.branch_id === selectedBranch?.id
      );

      // Apply date filter based on period
      const now = new Date();
      let startDate: Date;
      
      if (period === 'custom' && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        filtered = filtered.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      } else if (period === 'today') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      } else if (period === 'week') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        filtered = filtered.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate;
        });
      } else if (period === 'month') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        filtered = filtered.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate;
        });
      }

      // Apply category/subcategory filters
      if (filterCategoryId !== 'all') {
        filtered = filtered.filter((expense: Expense) => expense.category_id === filterCategoryId);
      }
      if (filterSubcategoryId !== 'all') {
        filtered = filtered.filter((expense: Expense) => expense.subcategory_id === filterSubcategoryId);
      }

      // Sort by date descending
      filtered.sort((a: Expense, b: Expense) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setExpenses(filtered);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadExpensesSummary = async () => {
    try {
      setLoading(true);
      const params: any = { period };
      if (period === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      if (filterCategoryId !== 'all') {
        params.category_id = filterCategoryId;
      }
      if (filterSubcategoryId !== 'all') {
        params.subcategory_id = filterSubcategoryId;
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

  const getAvailableSubcategories = () => {
    if (filterCategoryId === 'all') return [];
    const category = categories.find(c => c.id === filterCategoryId);
    return category?.expense_subcategory || [];
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getSubcategoryName = (subcategoryId: string) => {
    for (const category of categories) {
      const sub = category.expense_subcategory?.find(s => s.id === subcategoryId);
      if (sub) return sub.name;
    }
    return subcategoryId;
  };

  const getColor = (index: number) => {
    return COLORS[index % COLORS.length];
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Categoría</label>
                <Select
                  value={filterCategoryId}
                  onValueChange={(value) => {
                    setFilterCategoryId(value);
                    setFilterSubcategoryId('all');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Subcategoría</label>
                <Select
                  value={filterSubcategoryId}
                  onValueChange={setFilterSubcategoryId}
                  disabled={filterCategoryId === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las subcategorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las subcategorías</SelectItem>
                    {getAvailableSubcategories().map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <div className="text-3xl font-bold text-foreground">
                    ${summary.totalExpenses.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category/Subcategory Breakdown */}
            {summary.totalExpenses > 0 && (
              <div>
                {/* Show subcategories if filtering by subcategory, otherwise show categories */}
                {filterSubcategoryId !== 'all' && Object.keys(summary.subcategoryTotals || {}).length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Desglose</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Distribución del gasto por subcategoría
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {Object.entries(summary.subcategoryTotals)
                          .filter(([_, amount]) => amount > 0)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([subcategoryId, amount], index) => {
                            const percentage = ((amount as number) / summary.totalExpenses) * 100;
                            return (
                              <div key={subcategoryId} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`h-3 w-3 rounded-full ${getColor(index)}`}
                                    />
                                    <span className="font-medium">
                                      {getSubcategoryName(subcategoryId)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">
                                      {percentage.toFixed(1)}%
                                    </span>
                                    <span className="font-bold">
                                      ${(amount as number).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className={`h-full transition-all ${getColor(index)}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                ) : Object.keys(summary.categoryTotals || {}).length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Desglose</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Distribución del gasto por categoría
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {Object.entries(summary.categoryTotals)
                          .filter(([_, amount]) => amount > 0)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([categoryId, amount], index) => {
                            const percentage = ((amount as number) / summary.totalExpenses) * 100;
                            return (
                              <div key={categoryId} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`h-3 w-3 rounded-full ${getColor(index)}`}
                                    />
                                    <span className="font-medium">
                                      {getCategoryName(categoryId)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">
                                      {percentage.toFixed(1)}%
                                    </span>
                                    <span className="font-bold">
                                      ${(amount as number).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className={`h-full transition-all ${getColor(index)}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}

            {summary.totalExpenses === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No hay gastos registrados en este período
                </CardContent>
              </Card>
            )}

            {/* Expense List */}
            {expenses.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Detalle de Gastos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'} en el período seleccionado
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Subcategoría</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(expense.date).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {expense.description || '-'}
                          </TableCell>
                          <TableCell>
                            {expense.category ? (
                              <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
                                {expense.category.name}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {expense.subcategory ? (
                              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                {expense.subcategory.name}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${expense.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

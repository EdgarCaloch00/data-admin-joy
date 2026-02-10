import { useState, useEffect } from 'react';
import React from 'react';
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
  expenses: Expense[];
  period: {
    start: string;
    end: string;
  };
}

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
  }, [selectedBranch, period, filterCategoryId, filterSubcategoryId]);

  useEffect(() => {
    if (period === 'custom' && customStartDate && customEndDate) {
      loadExpensesSummary();
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
      setExpenses(data.expenses || []);
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

  // Group expenses by category and subcategory for hierarchical display
  const getGroupedExpenses = () => {
    const grouped: {
      [categoryId: string]: {
        categoryName: string;
        subcategories: {
          [subcategoryId: string]: {
            subcategoryName: string;
            expenses: Expense[];
            total: number;
          };
        };
        total: number;
      };
    } = {};

    expenses.forEach((expense) => {
      // Determine the category (prefer subcategory's parent category)
      let categoryId: string;
      let categoryName: string;
      
      if (expense.subcategory && expense.subcategory.category_id) {
        categoryId = expense.subcategory.category_id;
        categoryName = getCategoryName(categoryId);
      } else if (expense.category_id && expense.category) {
        categoryId = expense.category_id;
        categoryName = expense.category.name;
      } else {
        return; // Skip expenses without category
      }

      // Initialize category if not exists
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          categoryName,
          subcategories: {},
          total: 0,
        };
      }

      // Determine subcategory
      const subcategoryId = expense.subcategory_id || 'sin-subcategoria';
      const subcategoryName = expense.subcategory?.name || 'Sin subcategoría';

      // Initialize subcategory if not exists
      if (!grouped[categoryId].subcategories[subcategoryId]) {
        grouped[categoryId].subcategories[subcategoryId] = {
          subcategoryName,
          expenses: [],
          total: 0,
        };
      }

      // Add expense to subcategory
      grouped[categoryId].subcategories[subcategoryId].expenses.push(expense);
      grouped[categoryId].subcategories[subcategoryId].total += expense.amount;
      grouped[categoryId].total += expense.amount;
    });

    return grouped;
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

            {/* Expense List with Category and Subcategory Grouping */}
            {expenses.length > 0 ? (
              <Card>
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
                        <TableHead>Categoría / Subcategoría</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(getGroupedExpenses()).map(([categoryId, categoryData]) => (
                        <React.Fragment key={categoryId}>
                          {/* Category Header */}
                          <TableRow className="bg-primary/5 hover:bg-primary/10">
                            <TableCell colSpan={3} className="font-bold text-base">
                              {categoryData.categoryName}
                            </TableCell>
                            <TableCell className="text-right font-bold text-base">
                              ${categoryData.total.toFixed(2)}
                            </TableCell>
                          </TableRow>

                          {/* Subcategories and Expenses */}
                          {Object.entries(categoryData.subcategories).map(([subcategoryId, subcategoryData]) => (
                            <React.Fragment key={subcategoryId}>
                              {/* Subcategory Header */}
                              <TableRow className="bg-muted/30 hover:bg-muted/50">
                                <TableCell colSpan={3} className="pl-8 font-semibold text-sm">
                                  ↳ {subcategoryData.subcategoryName}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-sm">
                                  ${subcategoryData.total.toFixed(2)}
                                </TableCell>
                              </TableRow>

                              {/* Individual Expenses */}
                              {subcategoryData.expenses.map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-muted/20">
                                  <TableCell className="pl-16 whitespace-nowrap text-sm">
                                    {new Date(expense.date).toLocaleDateString('es-MX')}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {expense.description || '-'}
                                  </TableCell>
                                  <TableCell></TableCell>
                                  <TableCell className="text-right font-medium">
                                    ${expense.amount.toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}

                      {/* Grand Total Row */}
                      <TableRow className="bg-primary/10 hover:bg-primary/15 border-t-2 border-primary/20">
                        <TableCell colSpan={3} className="font-bold text-base">
                          Total General
                        </TableCell>
                        <TableCell className="text-right font-bold text-base">
                          ${summary.totalExpenses.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
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

import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { api, Expense, ExpenseCategory } from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useBranch } from "@/contexts/BranchContext";

const EXPENSE_CATEGORIES = [
  { value: "ingredients", label: "Ingredientes" },
  { value: "supplies", label: "Suministros" },
  { value: "utilities", label: "Servicios (Luz, Agua, Gas)" },
  { value: "rent", label: "Renta" },
  { value: "salaries", label: "Salarios" },
  { value: "other", label: "Otro" },
];

const getCategoryLabel = (category: ExpenseCategory) => {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found ? found.label : category;
};

const getCategoryColor = (category: ExpenseCategory) => {
  const colors: Record<ExpenseCategory, string> = {
    ingredients: "bg-green-100 text-green-700",
    supplies: "bg-yellow-100 text-yellow-700",
    utilities: "bg-blue-100 text-blue-700",
    rent: "bg-purple-100 text-purple-700",
    salaries: "bg-red-100 text-red-700",
    other: "bg-gray-100 text-gray-700",
  };
  return colors[category] || "bg-gray-100 text-gray-700";
};

export default function Gastos() {
  const { selectedBranch } = useBranch();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({});

  useEffect(() => {
    loadExpenses();
  }, [selectedBranch]);

  const loadExpenses = async () => {
    try {
      const data = await api.getExpenses();
      const filterByBranch = data.filter(
        (expense: Expense) => expense.branch_id === selectedBranch?.id
      );
      setExpenses(filterByBranch);
    } catch (error) {
      toast.error("Error al cargar gastos");
    }
  };

  const handleSave = async () => {
    try {
      if (!currentExpense.date) {
        toast.error("La fecha es requerida");
        return;
      }
      if (!currentExpense.amount || currentExpense.amount <= 0) {
        toast.error("El monto debe ser mayor a 0");
        return;
      }
      if (!currentExpense.description?.trim()) {
        toast.error("La descripción es requerida");
        return;
      }
      if (!currentExpense.category) {
        toast.error("La categoría es requerida");
        return;
      }

      if (currentExpense.id) {
        await api.updateExpense({
          id: currentExpense.id,
          date: currentExpense.date,
          amount: currentExpense.amount,
          description: currentExpense.description,
          category: currentExpense.category,
        });
        toast.success("Gasto actualizado");
      } else {
        await api.createExpense({
          date: currentExpense.date,
          amount: currentExpense.amount,
          description: currentExpense.description,
          category: currentExpense.category,
          branch_id: selectedBranch?.id || "",
        });
        toast.success("Gasto creado");
      }
      setIsDialogOpen(false);
      setCurrentExpense({});
      loadExpenses();
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar gasto");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este gasto?")) {
      try {
        await api.deleteExpense(id);
        toast.success("Gasto eliminado");
        loadExpenses();
      } catch (error) {
        toast.error("Error al eliminar gasto");
      }
    }
  };

  const filteredExpenses = expenses
    .filter((expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gastos</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona los gastos del negocio
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() =>
                  setCurrentExpense({
                    date: new Date().toISOString().split("T")[0],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {currentExpense.id ? "Editar Gasto" : "Nuevo Gasto"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha *</Label>
                    <Input
                      type="date"
                      value={currentExpense.date || ""}
                      onChange={(e) =>
                        setCurrentExpense({
                          ...currentExpense,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={currentExpense.amount || ""}
                      onChange={(e) =>
                        setCurrentExpense({
                          ...currentExpense,
                          amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={currentExpense.category || ""}
                    onValueChange={(value) =>
                      setCurrentExpense({
                        ...currentExpense,
                        category: value as ExpenseCategory,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Input
                    value={currentExpense.description || ""}
                    placeholder="Describe el gasto..."
                    onChange={(e) =>
                      setCurrentExpense({
                        ...currentExpense,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>Guardar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold">Lista de Gastos</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {new Date(expense.date).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.description}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(
                        expense.category
                      )}`}
                    >
                      {getCategoryLabel(expense.category)}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentExpense({
                            ...expense,
                            date: new Date(expense.date)
                              .toISOString()
                              .split("T")[0],
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredExpenses.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No se encontraron gastos
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { api, Expense, ExpenseCategory, ExpenseSubcategory } from "@/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Gastos() {
  const { selectedBranch } = useBranch();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({});
  
  // Category management
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<ExpenseCategory>>({});
  const [currentSubcategory, setCurrentSubcategory] = useState<Partial<ExpenseSubcategory & { category_id?: string }>>({});

  useEffect(() => {
    loadExpenses();
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const data = await api.getExpenseCategories();
      const filterByBranch = data.filter(
        (cat: ExpenseCategory) => cat.branch_id === selectedBranch?.id
      );
      setCategories(filterByBranch);
    } catch (error) {
      toast.error("Error al cargar categorías");
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
      if (!currentExpense.category_id) {
        toast.error("La categoría es requerida");
        return;
      }
      if (!currentExpense.subcategory_id) {
        toast.error("La subcategoría es requerida");
        return;
      }

      if (currentExpense.id) {
        await api.updateExpense({
          id: currentExpense.id,
          date: currentExpense.date,
          amount: currentExpense.amount,
          description: currentExpense.description,
          category_id: currentExpense.category_id,
          subcategory_id: currentExpense.subcategory_id,
        });
        toast.success("Gasto actualizado");
      } else {
        await api.createExpense({
          date: currentExpense.date,
          amount: currentExpense.amount,
          description: currentExpense.description,
          category_id: currentExpense.category_id!,
          subcategory_id: currentExpense.subcategory_id!,
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

  const handleSaveCategory = async () => {
    try {
      if (!currentCategory.name?.trim()) {
        toast.error("El nombre de la categoría es requerido");
        return;
      }

      if (currentCategory.id) {
        await api.updateExpenseCategory(currentCategory.id, { name: currentCategory.name });
        toast.success("Categoría actualizada");
      } else {
        await api.createExpenseCategory({
          name: currentCategory.name,
          branch_id: selectedBranch?.id || "",
        });
        toast.success("Categoría creada");
      }
      setIsCategoryDialogOpen(false);
      setCurrentCategory({});
      loadCategories();
    } catch (error) {
      toast.error("Error al guardar categoría");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría? Se eliminarán todas sus subcategorías.")) {
      try {
        await api.deleteExpenseCategory(id);
        toast.success("Categoría eliminada");
        loadCategories();
      } catch (error) {
        toast.error("Error al eliminar categoría");
      }
    }
  };

  const handleSaveSubcategory = async () => {
    try {
      if (!currentSubcategory.name?.trim()) {
        toast.error("El nombre de la subcategoría es requerido");
        return;
      }
      if (!currentSubcategory.category_id) {
        toast.error("Debes seleccionar una categoría");
        return;
      }

      if (currentSubcategory.id) {
        await api.updateExpenseSubcategory(currentSubcategory.id, { name: currentSubcategory.name });
        toast.success("Subcategoría actualizada");
      } else {
        await api.createExpenseSubcategory({
          name: currentSubcategory.name,
          category_id: currentSubcategory.category_id,
        });
        toast.success("Subcategoría creada");
      }
      setIsSubcategoryDialogOpen(false);
      setCurrentSubcategory({});
      loadCategories();
    } catch (error) {
      toast.error("Error al guardar subcategoría");
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta subcategoría?")) {
      try {
        await api.deleteExpenseSubcategory(id);
        toast.success("Subcategoría eliminada");
        loadCategories();
      } catch (error) {
        toast.error("Error al eliminar subcategoría");
      }
    }
  };

  const getAvailableSubcategories = () => {
    if (!currentExpense.category_id) return [];
    const category = categories.find(c => c.id === currentExpense.category_id);
    return category?.expense_subcategory || [];
  };

  const filteredExpenses = expenses
    .filter((expense) =>
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gastos</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona los gastos y categorías del negocio
          </p>
        </div>

        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
          </TabsList>

          {/* EXPENSES TAB */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-end">
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
                        value={currentExpense.category_id || ""}
                        onValueChange={(value) =>
                          setCurrentExpense({
                            ...currentExpense,
                            category_id: value,
                            subcategory_id: undefined,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subcategoría *</Label>
                      <Select
                        value={currentExpense.subcategory_id || ""}
                        onValueChange={(value) =>
                          setCurrentExpense({
                            ...currentExpense,
                            subcategory_id: value,
                          })
                        }
                        disabled={!currentExpense.category_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una subcategoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableSubcategories().map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Input
                        value={currentExpense.description || ""}
                        placeholder="Describe el gasto... (opcional)"
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
                    <TableHead>Subcategoría</TableHead>
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
                        {expense.description || "-"}
                      </TableCell>
                      <TableCell>
                        {expense.category ? (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            {expense.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.subcategory ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            {expense.subcategory.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
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
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setCurrentSubcategory({})}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Subcategoría
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentSubcategory.id ? "Editar Subcategoría" : "Nueva Subcategoría"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Categoría *</Label>
                      <Select
                        value={currentSubcategory.category_id || ""}
                        onValueChange={(value) =>
                          setCurrentSubcategory({
                            ...currentSubcategory,
                            category_id: value,
                          })
                        }
                        disabled={!!currentSubcategory.id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={currentSubcategory.name || ""}
                        placeholder="Ej: Leche, Huevos, etc."
                        onChange={(e) =>
                          setCurrentSubcategory({
                            ...currentSubcategory,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsSubcategoryDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveSubcategory}>Guardar</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setCurrentCategory({})}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Categoría
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentCategory.id ? "Editar Categoría" : "Nueva Categoría"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={currentCategory.name || ""}
                        placeholder="Ej: Ingredientes, Servicios, etc."
                        onChange={(e) =>
                          setCurrentCategory({
                            ...currentCategory,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCategoryDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveCategory}>Guardar</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-lg bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Categorías y Subcategorías</h2>
              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base font-semibold">{category.name}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentCategory(category);
                            setIsCategoryDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {category.expense_subcategory && category.expense_subcategory.length > 0 ? (
                        category.expense_subcategory.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between rounded-md bg-muted p-2"
                          >
                            <span className="text-sm">{sub.name}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentSubcategory({ ...sub, category_id: category.id });
                                  setIsSubcategoryDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubcategory(sub.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay subcategorías
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    No hay categorías. Crea una para empezar.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

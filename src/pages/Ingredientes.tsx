import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { api, Ingredient } from "@/lib/api";
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
import { Label } from "@/components/ui/label";
import { useBranch } from "@/contexts/BranchContext";

export default function Ingredientes() {
  const { selectedBranch } = useBranch();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<
    Partial<Ingredient>
  >({});

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const data = await api.getIngredients();
      const filterByBranch = data.filter(
        (ingredient: Ingredient) => ingredient.branch_id === selectedBranch?.id
      );
      setIngredients(filterByBranch);
    } catch (error) {
      toast.error("Error al cargar ingredientes");
    }
  };

  const handleSave = async () => {
    try {
      if (currentIngredient.id) {
        console.log(currentIngredient);
        await api.updateIngredient(currentIngredient);
        toast.success("Ingrediente actualizado");
      } else {
        await api.createIngredient({
          name: currentIngredient.name || "",
          current_stock: currentIngredient.current_stock || 0,
          min_stock: currentIngredient.min_stock || 0,
          unit_measurement: currentIngredient.unit_measurement || "",
          cost_unit: currentIngredient.cost_unit || 0,
          branch_id: selectedBranch?.id || "",
        });
        toast.success("Ingrediente creado");
      }
      setIsDialogOpen(false);
      setCurrentIngredient({});
      loadIngredients();
    } catch (error) {
      console.log(error);
      toast.error("Error al guardar ingrediente");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este ingrediente?")) {
      try {
        await api.deleteIngredient(id);
        toast.success("Ingrediente eliminado");
        loadIngredients();
      } catch (error) {
        toast.error("Error al eliminar ingrediente");
      }
    }
  };

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ingredientes</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona el inventario de ingredientes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentIngredient({})}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ingrediente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {currentIngredient.id
                    ? "Editar Ingrediente"
                    : "Nuevo Ingrediente"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={currentIngredient.name || ""}
                      onChange={(e) =>
                        setCurrentIngredient({
                          ...currentIngredient,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad</Label>
                    <Input
                      value={currentIngredient.unit_measurement || ""}
                      placeholder="kg, L, unidad"
                      onChange={(e) =>
                        setCurrentIngredient({
                          ...currentIngredient,
                          unit_measurement: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Actual</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentIngredient.current_stock || 0}
                      onChange={(e) =>
                        setCurrentIngredient({
                          ...currentIngredient,
                          current_stock: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentIngredient.min_stock || 0}
                      onChange={(e) =>
                        setCurrentIngredient({
                          ...currentIngredient,
                          min_stock: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo/Unidad</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentIngredient.cost_unit || 0}
                      onChange={(e) =>
                        setCurrentIngredient({
                          ...currentIngredient,
                          cost_unit: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
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
            <h2 className="mb-4 text-lg font-semibold">
              Lista de Ingredientes
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ingredientes..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Stock Mínimo</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Costo/Unidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((ingredient) => {
                const isLowStock =
                  ingredient.current_stock <= ingredient.min_stock;
                return (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      {ingredient.name}
                    </TableCell>
                    <TableCell>{ingredient.current_stock}</TableCell>
                    <TableCell>{ingredient.min_stock}</TableCell>
                    <TableCell>{ingredient.unit_measurement}</TableCell>
                    <TableCell>${ingredient.cost_unit}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          isLowStock
                            ? "bg-destructive/10 text-destructive"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {isLowStock ? "Bajo" : "Normal"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentIngredient(ingredient);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ingredient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}

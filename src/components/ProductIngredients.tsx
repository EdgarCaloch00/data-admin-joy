import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { api, Ingredient, ProductIngredient } from "@/lib/api";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductIngredientsProps {
  productId: string;
}

export function ProductIngredients({ productId }: ProductIngredientsProps) {
  const [productIngredients, setProductIngredients] = useState<
    ProductIngredient[]
  >([]);
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    loadProductIngredients();
    loadAvailableIngredients();
  }, [productId]);

  const loadProductIngredients = async () => {
    try {
      const data = await api.getProductIngredients(productId);
      setProductIngredients(data);
    } catch (error) {
      toast.error("Error al cargar ingredientes del producto");
    }
  };

  const loadAvailableIngredients = async () => {
    try {
      const data = await api.getIngredients();
      setAvailableIngredients(data);
    } catch (error) {
      toast.error("Error al cargar ingredientes");
    }
  };

  const handleAdd = async () => {
    if (!selectedIngredientId) {
      toast.error("Selecciona un ingrediente");
      return;
    }

    try {
      await api.addProductIngredient(
        productId,
        selectedIngredientId,
        quantity,
        false
      );
      toast.success("Ingrediente agregado al producto");
      setIsDialogOpen(false);
      setSelectedIngredientId("");
      setQuantity(1);
      loadProductIngredients();
    } catch (error) {
      toast.error("Error al agregar ingrediente");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este ingrediente del producto?")) {
      try {
        await api.deleteProductIngredient(id);
        toast.success("Ingrediente eliminado");
        loadProductIngredients();
      } catch (error) {
        toast.error("Error al eliminar ingrediente");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ingredientes del Producto</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Ingrediente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ingrediente</Label>
                <Select
                  value={selectedIngredientId}
                  onValueChange={setSelectedIngredientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIngredients.map((ingredient) => (
                      <SelectItem key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit_measurement})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAdd}>Agregar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {productIngredients.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productIngredients.map((pi) => (
              <TableRow key={pi.id}>
                <TableCell className="font-medium">
                  {pi.ingredient?.name || "N/A"}
                </TableCell>
                <TableCell>{pi.amount}</TableCell>
                <TableCell>
                  {pi.ingredient?.unit_measurement || "N/A"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pi.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-8">
          No hay ingredientes asignados a este producto
        </p>
      )}
    </div>
  );
}

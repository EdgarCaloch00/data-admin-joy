import { useState, useEffect, useMemo, useContext } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import { api, Product, TypeProduct } from "@/lib/api";
import { toast } from "sonner";
import { ProductIngredients } from "@/components/ProductIngredients";
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

export default function Productos() {
  const { selectedBranch } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<TypeProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIngredientsDialogOpen, setIsIngredientsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  useEffect(() => {
    if (selectedBranch?.id) {
      loadProducts();
      loadProductTypes();
    }
  }, [selectedBranch]); // Ahora se ejecuta cuando cambie la sucursal

  const loadProductTypes = async () => {
    try {
      const types = await api.getTypeProducts();
      setProductTypes(types);
    } catch (error) {
      toast.error("Error al cargar tipos de producto");
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      const filterByBranch = data.filter(
        (product: Product) => product.branch_id === selectedBranch?.id
      );
      setProducts(filterByBranch);
    } catch (error) {
      toast.error("Error al cargar productos");
    }
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        ...currentProduct,
        branch_id: selectedBranch.id, // Agregamos branch_id al payload
      };

      // Asegurar is_active por defecto en true si no está definido
      payload.is_active =
        typeof currentProduct.is_active === "boolean"
          ? currentProduct.is_active
          : true;

      if (currentProduct.id) {
        await api.updateProduct({
          id: payload.id,
          name: payload.name,
          price: payload.price,
          image: "",
          type_id: payload.type_id,
          is_active: payload.is_active,
        });
        toast.success("Producto actualizado");
      } else {
        await api.createProduct({
          name: payload.name,
          price: payload.price,
          image: "",
          type_id: payload.type_id,
          branch_id: selectedBranch.id, // Agregamos branch_id
        });
        toast.success("Producto creado");
      }
      setIsDialogOpen(false);
      setCurrentProduct({});
      loadProducts();
    } catch (error) {
      toast.error("Error al guardar producto");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await api.deleteProduct(id);
        toast.success("Producto eliminado");
        loadProducts();
      } catch (error) {
        toast.error("Error al eliminar producto");
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Productos</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona el catálogo de productos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentProduct({ is_active: true })}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentProduct.id ? "Editar Producto" : "Nuevo Producto"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={currentProduct.name || ""}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      value={currentProduct.price || 0}
                      onChange={(e) =>
                        setCurrentProduct({
                          ...currentProduct,
                          price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label>Tipo</Label>
                  <select
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    value={
                      (currentProduct.type_product && currentProduct.type_id) ||
                      (currentProduct as any).type_product_id ||
                      ""
                    }
                    onChange={(e) => {
                      const typeId = e.target.value;
                      const selected =
                        productTypes.find((t) => t.id === typeId) || null;
                      setCurrentProduct({
                        ...currentProduct,
                        // guardamos el objeto relacionado para que la UI muestre el nombre
                        type_product: selected,
                        // y también guardamos el id por si el API espera type_product_id
                        type_id: selected ? selected.id : undefined,
                      });
                    }}
                  >
                    <option value="">Sin tipo</option>
                    {productTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nuevo campo: Activo */}
                <div className="flex items-center gap-2">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={!!currentProduct.is_active}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        is_active: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_active" className="m-0">
                    Activo
                  </Label>
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
            <h2 className="mb-4 text-lg font-semibold">Lista de Productos</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
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
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Activo</TableHead> {/* <-- nueva columna */}
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">
                      {product.type_product?.name || "Sin tipo"}
                    </span>
                  </TableCell>
                  <TableCell>${product.price}</TableCell>

                  {/* Celda nueva: muestra si está activo */}
                  <TableCell>
                    {product.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        Inactivo
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setIsIngredientsDialogOpen(true);
                        }}
                      >
                        <PackagePlus className="h-4 w-4" />
                        Ingredientes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentProduct(product);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog
          open={isIngredientsDialogOpen}
          onOpenChange={setIsIngredientsDialogOpen}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Gestionar Ingredientes</DialogTitle>
            </DialogHeader>
            {selectedProductId && (
              <ProductIngredients productId={selectedProductId} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

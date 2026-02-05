import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { api, Combo } from "@/lib/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useBranch } from "@/contexts/BranchContext";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function Combos() {
  const { selectedBranch } = useBranch();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCombo, setCurrentCombo] = useState<Partial<Combo>>({});
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  useEffect(() => {
    loadCombos();
  }, []);

  const loadCombos = async () => {
    try {
      const data = await api.getCombos();
      const filterByBranch = data.filter(
        (combo: Combo) => combo.branch_id === selectedBranch?.id
      );
      setCombos(filterByBranch);
    } catch (error) {
      toast.error("Error al cargar combos");
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (!currentCombo.name?.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!currentCombo.price || currentCombo.price <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }
    if (!selectedBranch?.id) {
      toast.error("No hay sucursal seleccionada");
      return;
    }

    try {
      const comboData = {
        ...currentCombo,
        branch_id: selectedBranch.id,
        is_active: currentCombo.is_active ?? true,
        combo_day: selectedDays.length > 0 ? selectedDays.join(",") : undefined,
      };

      if (currentCombo.id) {
        await api.updateCombo(currentCombo.id, comboData);
        toast.success("Combo actualizado");
      } else {
        await api.createCombo(comboData);
        toast.success("Combo creado");
      }
      setIsDialogOpen(false);
      setCurrentCombo({});
      setSelectedDays([]);
      loadCombos();
    } catch (error) {
      console.error("Error al guardar combo:", error);
      toast.error("Error al guardar combo");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este combo?")) {
      try {
        await api.deleteCombo(id);
        toast.success("Combo eliminado");
        loadCombos();
      } catch (error) {
        toast.error("Error al eliminar combo");
      }
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const filteredCombos = combos.filter((combo) =>
    combo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Combos</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona los combos y promociones
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setCurrentCombo({});
              setSelectedDays([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setCurrentCombo({});
                setSelectedDays([]);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Combo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {currentCombo.id ? "Editar Combo" : "Nuevo Combo"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={currentCombo.name || ""}
                      onChange={(e) =>
                        setCurrentCombo({
                          ...currentCombo,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      value={currentCombo.price || 0}
                      onChange={(e) =>
                        setCurrentCombo({
                          ...currentCombo,
                          price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={currentCombo.description || ""}
                    onChange={(e) =>
                      setCurrentCombo({
                        ...currentCombo,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Días Disponibles</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={selectedDays.includes(day)}
                          onCheckedChange={() => toggleDay(day)}
                        />
                        <label
                          htmlFor={day}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setCurrentCombo({});
                      setSelectedDays([]);
                    }}
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
            <h2 className="mb-4 text-lg font-semibold">Lista de Combos</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar combos..."
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
                <TableHead>Descripción</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCombos.map((combo) => (
                <TableRow key={combo.id}>
                  <TableCell className="font-medium">{combo.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {combo.description}
                  </TableCell>
                  <TableCell>${combo.price}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        combo.is_active
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {combo.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentCombo(combo);
                          // Cargar días disponibles si existen
                          if (combo.combo_day) {
                            setSelectedDays(combo.combo_day.split(","));
                          } else {
                            setSelectedDays([]);
                          }
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(combo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}

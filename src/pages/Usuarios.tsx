import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil } from "lucide-react";
import { api, User, User_Role, UserRegister, UserUpdate } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<User_Role[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<
    Partial<User & { password: string }>
  >({});

  useEffect(() => {
    loadUsers();
    loadUserRoles();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    }
  };

  const loadUserRoles = async () => {
    try {
      const roles = await api.getUserRoles();
      setUserRoles(roles);
    } catch (error) {
      toast.error("Error al cargar roles");
    }
  };

  const handleSave = async () => {
    try {
      if (currentUser.id) {
        await api.updateUser(currentUser.id, currentUser as UserUpdate);
        toast.success("Usuario actualizado");
      } else {
        if (!currentUser.password) {
          toast.error("La contraseña es requerida");
          return;
        }
        if (!currentUser.role_id) {
          toast.error("El rol es requerido");
          return;
        }
        await api.createUser(currentUser as UserRegister);
        toast.success("Usuario creado");
      }
      setIsDialogOpen(false);
      setCurrentUser({});
      loadUsers();
    } catch (error) {
      toast.error("Error al guardar usuario");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona los usuarios del sistema
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentUser({})}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentUser.id ? "Editar Usuario" : "Nuevo Usuario"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={currentUser.name || ""}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={currentUser.email || ""}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, email: e.target.value })
                    }
                  />
                </div>
                {!currentUser.id && (
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={currentUser.password || ""}
                      onChange={(e) =>
                        setCurrentUser({
                          ...currentUser,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={currentUser.role_id?.toString()}
                    onValueChange={(value) =>
                      setCurrentUser({
                        ...currentUser,
                        role_id: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {currentUser.id && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={currentUser.is_active}
                      onCheckedChange={(checked) =>
                        setCurrentUser({ ...currentUser, is_active: checked })
                      }
                    />
                    <Label htmlFor="active">Usuario activo</Label>
                  </div>
                )}
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
            <h2 className="mb-4 text-lg font-semibold">Lista de Usuarios</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
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
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.user_role.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentUser(user);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
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

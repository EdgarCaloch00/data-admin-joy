import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Branch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch } from "@/contexts/BranchContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function SelectBranch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setSelectedBranch } = useBranch();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      let branchData: Branch[] = [];

      if (user?.user_role.code === "superadmin") {
        branchData = await api.getBranches();
      } else {
        const userBranches = await api.getUserBranches();
        const allBranches = await api.getBranches();
        branchData = allBranches.filter((branch) =>
          userBranches.some(
            (ub) => ub.branch_id === branch.id && ub.user_id === user.id
          )
        );
      }

      if (branchData.length === 0) {
        toast.error("No tienes sucursales asignadas");
        navigate("/login");
        return;
      }

      setBranches(branchData);
      setLoading(false);
    } catch (error) {
      toast.error("Error al cargar sucursales");
      navigate("/login");
    }
  };

  const handleSubmit = () => {
    const branch = branches.find((b) => b.id === selectedBranchId);
    if (branch) {
      setSelectedBranch(branch);
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Cargando sucursales...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-card p-10 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Selecciona una Sucursal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Elige la sucursal con la que deseas trabajar
          </p>
        </div>

        <div className="space-y-4">
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sucursal" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedBranchId}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}

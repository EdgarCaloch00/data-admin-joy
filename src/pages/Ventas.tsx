import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { api, Sale, SaleDetail, User } from "@/lib/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Ventas() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [saleDetails, setSaleDetails] = useState<SaleDetail[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [sellers, setSellers] = useState<User[]>([]);
  const [selectedType, setSelectedType] = useState("all"); // Add this state for product/combo filter

  useEffect(() => {
    loadSales();
    loadSellers();
  }, []);

  const loadSales = async () => {
    try {
      const data = await api.getSales();
      setSales(data);
    } catch (error) {
      toast.error("Error al cargar ventas");
    }
  };

  const loadSellers = async () => {
    try {
      const data = await api.getCashier();
      setSellers(data);
    } catch (error) {
      toast.error("Error al cargar cajeros");
    }
  };

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.user?.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Date is already in Mexico City time from backend
    const saleDate = new Date(sale.created_at);

    // Parse filter dates (local time)
    let fromDate = null;
    let toDate = null;

    if (dateFrom) {
      fromDate = new Date(dateFrom + "T00:00:00");
    }

    if (dateTo) {
      toDate = new Date(dateTo + "T23:59:59");
    }

    const matchesDateFrom = !fromDate || saleDate >= fromDate;
    const matchesDateTo = !toDate || saleDate <= toDate;
    const matchesSeller =
      selectedSeller === "all" || sale.user_id === selectedSeller;
    const matchesPaymentMethod =
      selectedPaymentMethod === "all" ||
      sale.payment_method === selectedPaymentMethod;

    // Add type filtering
    const matchesType =
      selectedType === "all" ||
      (selectedType === "products" &&
        sale.sale_detail?.some((detail) => detail.product)) ||
      (selectedType === "combos" &&
        sale.sale_detail?.some((detail) => detail.combo));

    return (
      matchesSearch &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesSeller &&
      matchesPaymentMethod &&
      matchesType
    );
  });

  const sortAndPaginateData = (data: Sale[]) => {
    // Ordenar
    let sortedData = [...data];
    if (sortColumn) {
      sortedData.sort((a, b) => {
        let compareA =
          sortColumn === "date"
            ? new Date(a.created_at).getTime()
            : sortColumn === "seller"
            ? a.user?.name
            : sortColumn === "total"
            ? a.total
            : sortColumn === "payment"
            ? a.payment_method
            : "";

        let compareB =
          sortColumn === "date"
            ? new Date(b.created_at).getTime()
            : sortColumn === "seller"
            ? b.user?.name
            : sortColumn === "total"
            ? b.total
            : sortColumn === "payment"
            ? b.payment_method
            : "";

        if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
        if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Paginar
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedData.slice(indexOfFirstItem, indexOfLastItem);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleString("es-MX", options);
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      cash: "default",
      card: "secondary",
      transfer: "outline",
    };
    return variants[method] || "outline";
  };

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  const handleViewDetails = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (sale?.sale_detail) {
      setSaleDetails(sale.sale_detail);
      setSelectedSale(saleId);
      setIsDetailOpen(true);
    }
  };

  const handleDeleteDetail = async (detailId: string) => {
    try {
      await api.deleteSaleDetail(detailId);

      // Update the local state after successful deletion
      if (selectedSale) {
        const updatedSales = sales.map((sale) => {
          if (sale.id === selectedSale) {
            return {
              ...sale,
              sale_detail: sale.sale_detail?.filter(
                (detail) => detail.id !== detailId
              ),
            };
          }
          return sale;
        });
        setSales(updatedSales);

        // Update the details view
        const currentSale = updatedSales.find((s) => s.id === selectedSale);
        if (currentSale?.sale_detail) {
          setSaleDetails(currentSale.sale_detail);
        }
      }

      toast.success("Detalle eliminado correctamente");
    } catch (error) {
      toast.error("Error al eliminar el detalle");
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
      return;
    }

    try {
      await api.deleteSale(saleId);
      toast.success("Venta eliminada correctamente");
      loadSales(); // Recargar la lista de ventas
    } catch (error) {
      toast.error("Error al eliminar la venta");
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Ventas</h1>
          <p className="mt-2 text-muted-foreground">
            Visualiza y gestiona las ventas realizadas
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total de Ventas</p>
              <p className="text-2xl font-bold">{filteredSales.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto Total</p>
              <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Promedio</p>
              <p className="text-2xl font-bold">
                $
                {filteredSales.length > 0
                  ? (totalSales / filteredSales.length).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold">Lista de Ventas</h2>

            <div className="grid gap-4 mb-4 md:grid-cols-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  Fecha desde
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Fecha hasta
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Vendedor
                </label>
                <Select
                  value={selectedSeller}
                  onValueChange={setSelectedSeller}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los vendedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Método de pago
                </label>
                <Select
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los métodos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Tipo</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="products">Productos</SelectItem>
                    <SelectItem value="combos">Combos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ventas..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("date")}
                >
                  Fecha{" "}
                  {sortColumn === "date" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("seller")}
                >
                  Vendedor{" "}
                  {sortColumn === "seller" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("payment")}
                >
                  Método de Pago{" "}
                  {sortColumn === "payment" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("total")}
                >
                  Total{" "}
                  {sortColumn === "total" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortAndPaginateData(filteredSales).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-sm">
                    {formatDate(sale.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {sale.user?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentMethodBadge(sale.payment_method)}>
                      {sale.payment_method == "cash" ? "Efectivo" : "Tarjeta"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${sale.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(sale.id)}
                      >
                        Ver detalles
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              {Math.min(currentPage * itemsPerPage, filteredSales.length)} de{" "}
              {filteredSales.length} registros
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((curr) => Math.max(curr - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((curr) => curr + 1)}
                disabled={currentPage * itemsPerPage >= filteredSales.length}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Venta</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto/Combo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unitario</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleDetails.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell>
                      {detail.product?.name || detail.combo?.name || "N/A"}
                    </TableCell>
                    <TableCell>{detail.amount}</TableCell>
                    <TableCell>
                      $
                      {detail.product?.price ||
                        detail.combo?.price ||
                        (detail.subtotal / detail.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>${detail.subtotal.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteDetail(detail.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

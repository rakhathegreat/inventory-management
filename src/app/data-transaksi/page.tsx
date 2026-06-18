import { useState, useEffect } from "react"
import { DataTable } from "@/components/data-table"
import { invoke } from "@tauri-apps/api/core"
import { Card } from "@/components/ui/card"
import { Download, Plus, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

const KATEGORI_OPTIONS = ["Masuk", "Keluar", "Rusak"]

type Transaction = {
  id: string;
  tanggal: string;
  nomor: string;
  kategori: string;
  status: string;
  sn: string;
  merek: string;
  asal: string | null;
  tujuan: string | null;
  operator: string;
};

export default function DataTransaksiPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterKategori, setFilterKategori] = useState("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const fetchTransactions = async () => {
    try {
      const data = await invoke<Transaction[]>("get_transactions");
      setTransactions(data);
    } catch (error) {
      console.error("Gagal mengambil data transaksi:", error);
      toast.error("Gagal memuat data riwayat transaksi.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [])

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await invoke("delete_transaction", { id });
      }
      toast.success(`${selectedIds.length} transaksi berhasil dihapus.`)
      setSelectedIds([])
      fetchTransactions();
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
      toast.error("Gagal menghapus transaksi.");
    }
  }

  const handleDeleteRow = async (id: string) => {
    try {
      await invoke("delete_transaction", { id });
      toast.success("Transaksi berhasil dihapus.");
      fetchTransactions();
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);
      toast.error("Gagal menghapus transaksi.");
    }
  };

  const handleExport = (format: string) => {
    toast.success(`Data transaksi berhasil diekspor sebagai ${format}.`)
  }

  const flattenedData = transactions.map((t) => ({
    id: t.id,
    tanggal: t.tanggal,
    nomor: t.nomor,
    kategori: t.kategori,
    status: t.status,
    sn: t.sn,
    merek: t.merek,
    asal: t.asal || "-",
    tujuan: t.tujuan || "-",
  }));

  const filteredData = flattenedData.filter((item) => {
    const matchesSearch = item.nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = filterKategori === "all" || item.kategori === filterKategori;
    return matchesSearch && matchesKategori;
  });
  const hasActiveFilter = searchTerm.length > 0 || filterKategori !== "all";
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Page Header */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute top-2 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor transaksi..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger className="w-[160px] py-0">
                  <SelectValue placeholder="Kategori Transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {KATEGORI_OPTIONS.map((kategori) => (
                    <SelectItem key={kategori} value={kategori}>{kategori}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || filterKategori !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterKategori("all")
                  }}
                >
                  Reset Filter
                </Button>
              )}
            </div>

          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {selectedIds.length > 0 && (
              <Button variant="outline" onClick={handleBulkDelete}>
                <Trash2 className="size-4 mr-2" />
                Hapus ({selectedIds.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => handleExport("Excel")}>
              <Download className="size-4" />
              <span>Export Data</span>
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <Link to="/barang-masuk" className="flex flex-row items-center">
                <Plus className="size-4" />
                <span>Buat Transaksi</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>
      <DataTable
        data={filteredData}
        isFiltered={hasActiveFilter}
        onSelectionChange={setSelectedIds}
        onDeleteRow={handleDeleteRow}
      />
    </div>
  )
}

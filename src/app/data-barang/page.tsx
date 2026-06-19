"use client"

import { useState, useMemo, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import {
  Boxes,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Download,
  ScanLine,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { toast } from "sonner"
import { Link } from "react-router-dom"

type StatusUnit = "Masuk" | "Keluar" | "Rusak"

interface BarangUnit {
  id: string;
  serialNumber: string;
  kategori: string;
  merek: string;
  status: StatusUnit;
  lokasiPenyimpanan: string;
  tanggalMasuk: string;
  tanggalKeluar?: string;
}

interface RiwayatUnit {
  tanggal: string;
  tipe: string;
  nomorSurat: string;
  dariStatus: string;
  keStatus: string;
  lokasi: string;
  catatan?: string;
}

interface Transaction {
  id: string;
  tanggal: string;
  nomor: string;
  kategori: string;
  status: string;
  sn: string;
  merek: string;
  asal: string | null;
  tujuan: string | null;
}

type DeleteDialogState =
  | {
    type: "single"
    ids: string[]
    serialNumber: string
  }
  | {
    type: "bulk"
    ids: string[]
  }

const STATUS_OPTIONS: StatusUnit[] = ["Masuk", "Keluar", "Rusak"]
const getLokasiPenyimpanan = (
  status: StatusUnit,
  lokasiPenyimpanan: string
) => status === "Keluar" ? "Keluar" : lokasiPenyimpanan.trim()

function EmptyBarangTableState({
  isFiltered,
}: {
  isFiltered: boolean
}) {
  return (
    <div className="flex min-h-[300px] items-center justify-center px-6 py-12">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border bg-muted/40 text-muted-foreground">
          {isFiltered ? (
            <Search className="size-7" strokeWidth={1.8} />
          ) : (
            <Boxes className="size-7" strokeWidth={1.8} />
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">
            {isFiltered ? "Tidak ada unit yang cocok" : "Belum ada data barang"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isFiltered
              ? "Coba ubah kata kunci pencarian atau status filter yang sedang aktif."
              : "Data unit akan tampil di sini setelah barang masuk didaftarkan ke sistem."}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DataBarangPage() {
  const isMobile = useIsMobile()
  const [barangList, setBarangList] = useState<BarangUnit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dbCategories, setDbCategories] = useState<string[]>([])
  const [dbLocations, setDbLocations] = useState<string[]>([])

  const loadData = async () => {
    try {
      const data = await invoke<BarangUnit[]>("get_items")
      const normalizedData = data.map((item) => ({
        ...item,
        lokasiPenyimpanan: getLokasiPenyimpanan(
          item.status,
          item.lokasiPenyimpanan || ""
        ),
      }))
      setBarangList(normalizedData)

      const legacyExitedItems = data.filter(
        (item) =>
          item.status === "Keluar" &&
          item.lokasiPenyimpanan?.trim() !== "Keluar"
      )

      if (legacyExitedItems.length > 0) {
        const updateResults = await Promise.allSettled(
          legacyExitedItems.map((item) =>
            invoke("update_item", {
              item: {
                ...item,
                lokasiPenyimpanan: "Keluar",
              },
            })
          )
        )

        if (updateResults.some((result) => result.status === "rejected")) {
          console.warn("Sebagian lokasi barang keluar gagal diperbarui ke database.")
        }
      }

      const transactionData = await invoke<Transaction[]>("get_transactions")
      setTransactions(transactionData)

      const categories = await invoke<any[]>("get_categories")
      setDbCategories(categories.map(c => c.name))

      const locationsData = await invoke<any[]>("get_locations")
      const locs: string[] = []
      locationsData.forEach(loc => {
        if (loc.type === "Rak" && loc.levels) {
          loc.levels.forEach((lvl: any) => locs.push(`${loc.name} - ${lvl.name}`))
        } else {
          locs.push(loc.name)
        }
      })
      setDbLocations(locs)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Gagal memuat data dari server.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  const [filterStatus, setFilterStatus] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [selectedBarang, setSelectedBarang] = useState<BarangUnit | null>(null)
  const [formData, setFormData] = useState({
    serialNumber: "",
    kategori: "",
    merek: "",
    status: "Masuk" as StatusUnit,
    lokasiPenyimpanan: "",
    tanggalMasuk: "",
    tanggalKeluar: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailBarang, setDetailBarang] = useState<BarangUnit | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const resetForm = () => {
    setFormData({
      serialNumber: "",
      kategori: "",
      merek: "",
      status: "Masuk",
      lokasiPenyimpanan: "",
      tanggalMasuk: new Date().toISOString().slice(0, 10),
      tanggalKeluar: "",
    })
    setFormErrors({})
    setSelectedBarang(null)
  }

  const handleOpenEdit = (barang: BarangUnit) => {
    setFormMode("edit")
    setSelectedBarang(barang)
    setFormData({
      serialNumber: barang.serialNumber,
      kategori: barang.kategori,
      merek: barang.merek,
      status: barang.status,
      lokasiPenyimpanan: getLokasiPenyimpanan(
        barang.status,
        barang.lokasiPenyimpanan
      ),
      tanggalMasuk: barang.tanggalMasuk,
      tanggalKeluar: barang.tanggalKeluar || "",
    })
    setFormErrors({})
    setIsFormOpen(true)
  }

  const handleOpenDetail = (barang: BarangUnit) => {
    setDetailBarang(barang)
    setIsDetailOpen(true)
  }

  const handleDelete = async (id: string) => {
    const barang = barangList.find(b => b.id === id)
    if (!barang) return
    setDeleteDialog({
      type: "single",
      ids: [id],
      serialNumber: barang.serialNumber,
    })
  }

  const confirmDelete = async () => {
    if (!deleteDialog) return
    const idsToDelete = deleteDialog.ids

    try {
      for (const id of idsToDelete) {
        await invoke("delete_item", { id })
      }

      setBarangList(prev => prev.filter(b => !idsToDelete.includes(b.id)))
      setSelectedIds(prev => prev.filter(selectedId => !idsToDelete.includes(selectedId)))
      setDeleteDialog(null)

      if (deleteDialog.type === "single") {
        toast.success(`Unit dengan SN ${deleteDialog.serialNumber} berhasil dihapus dari sistem.`)
      } else {
        toast.success(`${idsToDelete.length} unit berhasil dihapus dari sistem.`)
      }
    } catch (error) {
      toast.error(deleteDialog.type === "single" ? "Gagal menghapus unit." : "Gagal menghapus beberapa unit.")
    }
  }

  const buildRusakTransaction = async (
    barang: BarangUnit,
    lokasiAsal: string
  ): Promise<Transaction> => {
    const transactionDate = new Date().toISOString().slice(0, 10)
    const dateCode = transactionDate.replace(/-/g, "")
    const prefix = `DMG-${dateCode}-`
    const latestTransactions = await invoke<Transaction[]>("get_transactions")
    let maxSequence = 0

    latestTransactions.forEach((transaction) => {
      if (!transaction.nomor.startsWith(prefix)) return

      const sequence = Number.parseInt(transaction.nomor.slice(prefix.length), 10)
      if (!Number.isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence
      }
    })

    return {
      id: `TRX-DMG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tanggal: transactionDate,
      nomor: `${prefix}${String(maxSequence + 1).padStart(4, "0")}`,
      kategori: "Rusak",
      status: "Selesai",
      sn: barang.serialNumber,
      merek: barang.merek,
      asal: lokasiAsal || barang.lokasiPenyimpanan,
      tujuan: barang.lokasiPenyimpanan,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    const lokasiPenyimpanan = getLokasiPenyimpanan(
      formData.status,
      formData.lokasiPenyimpanan
    )
    if (!formData.serialNumber.trim()) errors.serialNumber = "Serial number wajib diisi"
    if (!formData.kategori.trim()) errors.kategori = "Kategori wajib diisi"
    if (!formData.merek.trim()) errors.merek = "Merek barang wajib diisi"
    if (!lokasiPenyimpanan) errors.lokasiPenyimpanan = "Lokasi penyimpanan wajib diisi"
    if (!formData.tanggalMasuk.trim()) errors.tanggalMasuk = "Tanggal masuk wajib diisi"
    const isDuplicateSN = barangList.some(b =>
      b.serialNumber.trim().toLowerCase() === formData.serialNumber.trim().toLowerCase() &&
      (formMode === "add" || b.id !== selectedBarang?.id)
    )
    if (isDuplicateSN) errors.serialNumber = "Serial number sudah terdaftar di sistem"

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Gagal menyimpan. Silakan periksa kembali form Anda.")
      return
    }

    if (formMode === "add") {
      const newBarang: BarangUnit = {
        id: `UNIT-${Date.now()}`,
        serialNumber: formData.serialNumber.toUpperCase(),
        kategori: formData.kategori,
        merek: formData.merek,
        status: formData.status,
        lokasiPenyimpanan,
        tanggalMasuk: formData.tanggalMasuk,
        tanggalKeluar: formData.tanggalKeluar || undefined,
      }
      try {
        await invoke("add_item", { item: newBarang })

        if (newBarang.status === "Rusak") {
          let rusakTransaction: Transaction | null = null

          try {
            rusakTransaction = await buildRusakTransaction(
              newBarang,
              newBarang.lokasiPenyimpanan
            )
            await invoke("add_transaction", { transaction: rusakTransaction })
            if (rusakTransaction) {
              const savedTransaction = rusakTransaction
              setTransactions(prev => [savedTransaction, ...prev])
            }
          } catch (transactionError) {
            if (rusakTransaction) {
              await invoke("delete_transaction", { id: rusakTransaction.id }).catch(() => undefined)
            }
            await invoke("delete_item", { id: newBarang.id })
            throw transactionError
          }
        }

        setBarangList(prev => [newBarang, ...prev])
        toast.success(`Unit baru dengan SN ${newBarang.serialNumber} berhasil didaftarkan!`)
      } catch (error) {
        toast.error("Gagal menyimpan unit.")
        return
      }
    } else {
      const originalBarang = selectedBarang!
      const updatedBarang = {
        ...originalBarang,
        serialNumber: formData.serialNumber.toUpperCase(),
        kategori: formData.kategori,
        merek: formData.merek,
        status: formData.status,
        lokasiPenyimpanan,
        tanggalMasuk: formData.tanggalMasuk,
        tanggalKeluar: formData.tanggalKeluar || undefined,
      }
      const changedToRusak =
        originalBarang.status !== "Rusak" && updatedBarang.status === "Rusak"

      try {
        await invoke("update_item", { item: updatedBarang })

        if (changedToRusak) {
          let rusakTransaction: Transaction | null = null

          try {
            rusakTransaction = await buildRusakTransaction(
              updatedBarang,
              originalBarang.lokasiPenyimpanan
            )
            await invoke("add_transaction", { transaction: rusakTransaction })
            if (rusakTransaction) {
              const savedTransaction = rusakTransaction
              setTransactions(prev => [savedTransaction, ...prev])
            }
          } catch (transactionError) {
            if (rusakTransaction) {
              await invoke("delete_transaction", { id: rusakTransaction.id }).catch(() => undefined)
            }
            await invoke("update_item", { item: originalBarang })
            throw transactionError
          }
        }

        setBarangList(prev => prev.map(b => b.id === originalBarang.id ? updatedBarang : b))
        toast.success(
          changedToRusak
            ? `Unit dengan SN ${updatedBarang.serialNumber} ditandai Rusak dan dicatat ke riwayat.`
            : `Unit dengan SN ${updatedBarang.serialNumber} berhasil diperbarui!`
        )
      } catch (error) {
        console.error("Gagal memperbarui unit:", error)
        toast.error(
          changedToRusak
            ? "Gagal menyimpan status Rusak ke data barang dan riwayat."
            : "Gagal memperbarui unit."
        )
        return
      }
    }

    setIsFormOpen(false)
    resetForm()
  }

  const filteredBarang = useMemo(() => {
    return barangList.filter(b => {
      const matchesSearch =
        b.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.merek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.lokasiPenyimpanan.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || b.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [barangList, searchTerm, filterStatus])
  const hasActiveFilter = searchTerm.trim().length > 0 || filterStatus !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredBarang.length / pageSize))
  const paginatedBarang = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredBarang.slice(startIndex, startIndex + pageSize)
  }, [currentPage, filteredBarang, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [
        ...new Set([...prev, ...paginatedBarang.map(b => b.id)])
      ])
    } else {
      const pageIds = new Set(paginatedBarang.map(b => b.id))
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)))
    }
  }

  const handleSelectRow = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setDeleteDialog({
      type: "bulk",
      ids: selectedIds,
    })
  }

  const getStatusBadgeProps = (status: StatusUnit) => {
    switch (status) {
      case "Masuk":
        return { text: "Masuk", dotClass: "bg-emerald-500" }
      case "Keluar":
        return { text: "Keluar", dotClass: "bg-sky-500" }
      case "Rusak":
      default:
        return { text: "Rusak", dotClass: "bg-rose-500" }
    }
  }

  const formatTanggal = (tgl: string) => {
    if (!tgl) return "-"
    const date = new Date(tgl)
    if (isNaN(date.getTime())) return tgl
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
  }

  const handleExportExcel = () => {
    if (filteredBarang.length === 0) {
      toast.error("Tidak ada data barang yang dapat diekspor.")
      return
    }

    try {
      const escapeCsvCell = (value: string | number | undefined) => {
        let cell = String(value ?? "")

        // Hindari formula injection ketika file dibuka di aplikasi spreadsheet.
        if (/^[\t\r ]*[=+\-@]/.test(cell)) {
          cell = `'${cell}`
        }

        return `"${cell.replace(/"/g, '""')}"`
      }

      const headers = [
        "No",
        "Serial Number",
        "Merek",
        "Kategori",
        "Status",
        "Lokasi Penyimpanan",
        "Tanggal Masuk",
        "Tanggal Keluar",
      ]

      const rows = filteredBarang.map((item, index) => [
        index + 1,
        item.serialNumber,
        item.merek,
        item.kategori,
        item.status,
        item.lokasiPenyimpanan,
        item.tanggalMasuk,
        item.tanggalKeluar || "",
      ])

      const csvContent = [
        "sep=;",
        headers.map(escapeCsvCell).join(";"),
        ...rows.map((row) => row.map(escapeCsvCell).join(";")),
      ].join("\r\n")

      const blob = new Blob([`\uFEFF${csvContent}`], {
        type: "text/csv;charset=utf-8",
      })
      const downloadUrl = URL.createObjectURL(blob)
      const downloadLink = document.createElement("a")
      const now = new Date()
      const dateSuffix = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-")

      downloadLink.href = downloadUrl
      downloadLink.download = `data-barang-${dateSuffix}.csv`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)

      toast.success(`${filteredBarang.length} data barang berhasil diekspor untuk Excel.`)
    } catch (error) {
      console.error("Gagal mengekspor data barang:", error)
      toast.error("Gagal memproses ekspor data barang.")
    }
  }

  const recentRiwayat = useMemo<RiwayatUnit[]>(() => {
    if (!detailBarang) return []

    return transactions
      .filter((transaction) => transaction.sn.toLowerCase() === detailBarang.serialNumber.toLowerCase())
      .map<RiwayatUnit>((transaction) => ({
        tanggal: transaction.tanggal,
        tipe: transaction.kategori,
        nomorSurat: transaction.nomor,
        dariStatus: transaction.asal || "-",
        keStatus: transaction.tujuan || "-",
        lokasi: transaction.tujuan || transaction.asal || detailBarang.lokasiPenyimpanan,
      }))
  }, [detailBarang, transactions])

  return (
    <div className="flex min-h-0 flex-col gap-6 overflow-hidden p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Filter and Search Section */}
      <Card className="shrink-0 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute top-2 left-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari serial number, merek, lokasi..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] py-0">
                  <SelectValue placeholder="Status Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || filterStatus !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterStatus("all")
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
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={filteredBarang.length === 0}
            >
              <Download className="size-4" />
              <span>Export Excel</span>
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <Link to="/barang-masuk" className="flex flex-row items-center">
                <Plus className="size-4" />
                <span>Tambah Unit Baru</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <div className="min-h-0 flex-1 rounded-lg border bg-card/20 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>
              <TableHead className="w-[50px] text-center">No.</TableHead>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={
                    paginatedBarang.length > 0 &&
                    paginatedBarang.every(item => selectedIds.includes(item.id))
                  }
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  aria-label="Pilih semua"
                />
              </TableHead>
              <TableHead className="w-[170px]">Serial Number (SN)</TableHead>
              <TableHead className="w-[140px]">Merek</TableHead>
              <TableHead className="w-[140px]">Kategori</TableHead>
              <TableHead className="text-center w-[120px]">Status</TableHead>
              <TableHead>Lokasi Penyimpanan</TableHead>
              <TableHead className="hidden md:table-cell w-[130px]">Tanggal Masuk</TableHead>
              <TableHead className="hidden lg:table-cell w-[130px]">Tanggal Keluar</TableHead>
              <TableHead className="w-[60px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBarang.length > 0 ? (
              paginatedBarang.map((item, index) => {
                const badge = getStatusBadgeProps(item.status)
                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                    data-state={selectedIds.includes(item.id) ? "selected" : undefined}
                  >
                    <TableCell className="text-center font-medium">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectRow(checked as boolean, item.id)}
                        aria-label={`Pilih ${item.serialNumber}`}
                      />
                    </TableCell>
                    <TableCell>
                      {item.serialNumber}
                    </TableCell>
                    <TableCell>
                      {item.merek}
                    </TableCell>
                    <TableCell>
                      {item.kategori}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-normal gap-1.5 px-2.5 py-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                        {badge.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.lokasiPenyimpanan}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatTanggal(item.tanggalMasuk)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatTanggal(item.tanggalKeluar || "")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon-xs" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="size-4" />
                            <span className="sr-only">Menu Aksi</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(item) }}>
                            <Edit className="size-4 mr-2" />
                            <span>Edit Unit</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                            className="text-destructive hover:bg-destructive/10 dark:text-destructive/80"
                          >
                            <Trash2 className="size-4 mr-2" />
                            <span>Hapus</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyBarangTableState isFiltered={hasActiveFilter} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {filteredBarang.length > 0 && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Baris per halaman</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Drawer Form */}
      <Drawer open={isFormOpen} onOpenChange={setIsFormOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>
              {formMode === "add" ? "Registrasi Unit Baru" : "Edit Informasi Unit"}
            </DrawerTitle>
            <DrawerDescription>
              Isi data detail berikut untuk mendaftarkan atau memutakhirkan unit barang berdasarkan serial number di sistem gudang.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Serial Number */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="serialNumber">Serial Number (SN)</Label>
                <div className="relative">
                  <ScanLine className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                  <Input
                    id="serialNumber"
                    placeholder="Scan atau ketik serial number..."
                    value={formData.serialNumber}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, serialNumber: e.target.value }))
                      if (formErrors.serialNumber) {
                        setFormErrors(prev => { const next = { ...prev }; delete next.serialNumber; return next })
                      }
                    }}
                    className={`pl-9 ${formErrors.serialNumber ? "border-destructive" : ""}`}
                  />
                </div>
                {formErrors.serialNumber && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.serialNumber}</p>
                )}
              </div>

              {/* Kategori */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="kategori">Kategori</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(val) => {
                    setFormData(prev => ({ ...prev, kategori: val }))
                    if (formErrors.kategori) {
                      setFormErrors(prev => { const next = { ...prev }; delete next.kategori; return next })
                    }
                  }}
                >
                  <SelectTrigger id="kategori" className={formErrors.kategori ? "border-destructive" : ""}>
                    <SelectValue placeholder="Pilih kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dbCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.kategori && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.kategori}</p>
                )}
              </div>

              {/* Merek */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="merek">Merek</Label>
                <Input
                  id="merek"
                  placeholder="MikroTik, Dell, Cisco..."
                  value={formData.merek}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, merek: e.target.value }))
                    if (formErrors.merek) {
                      setFormErrors(prev => { const next = { ...prev }; delete next.merek; return next })
                    }
                  }}
                  className={formErrors.merek ? "border-destructive" : ""}
                />
                {formErrors.merek && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.merek}</p>
                )}
              </div>

              {/* Status & Tanggal Masuk */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="status">Status Unit</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => {
                      const status = val as StatusUnit
                      setFormData(prev => ({
                        ...prev,
                        status,
                        lokasiPenyimpanan:
                          status === "Keluar"
                            ? "Keluar"
                            : prev.lokasiPenyimpanan === "Keluar"
                              ? ""
                              : prev.lokasiPenyimpanan,
                      }))
                      if (status === "Keluar" && formErrors.lokasiPenyimpanan) {
                        setFormErrors(prev => {
                          const next = { ...prev }
                          delete next.lokasiPenyimpanan
                          return next
                        })
                      }
                    }}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="tanggalMasuk">Tanggal Masuk</Label>
                  <Input
                    id="tanggalMasuk"
                    type="date"
                    value={formData.tanggalMasuk}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, tanggalMasuk: e.target.value }))
                      if (formErrors.tanggalMasuk) {
                        setFormErrors(prev => { const next = { ...prev }; delete next.tanggalMasuk; return next })
                      }
                    }}
                    className={formErrors.tanggalMasuk ? "border-destructive" : ""}
                  />
                  {formErrors.tanggalMasuk && (
                    <p className="text-[11px] text-destructive font-medium">{formErrors.tanggalMasuk}</p>
                  )}
                </div>
              </div>

              {/* Lokasi Penyimpanan & Tanggal Keluar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="lokasiPenyimpanan">Lokasi Penyimpanan</Label>
                  <Select
                    value={formData.lokasiPenyimpanan}
                    disabled={formData.status === "Keluar"}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, lokasiPenyimpanan: val }))
                      if (formErrors.lokasiPenyimpanan) {
                        setFormErrors(prev => { const next = { ...prev }; delete next.lokasiPenyimpanan; return next })
                      }
                    }}
                  >
                    <SelectTrigger id="lokasiPenyimpanan">
                      <SelectValue placeholder="Pilih lokasi penyimpanan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.status === "Keluar" && (
                        <SelectItem value="Keluar">Keluar</SelectItem>
                      )}
                      {dbLocations.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.lokasiPenyimpanan && (
                    <p className="text-[11px] text-destructive font-medium">{formErrors.lokasiPenyimpanan}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="tanggalKeluar">Tanggal Keluar</Label>
                  <Input
                    id="tanggalKeluar"
                    type="date"
                    value={formData.tanggalKeluar || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalKeluar: e.target.value }))}
                  />
                </div>
              </div>
              <DrawerFooter>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-semibold"
                >
                  Simpan Unit
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Batal
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer open={isDetailOpen} onOpenChange={setIsDetailOpen} direction={isMobile ? "bottom" : "right"}>
        <DrawerContent>
          {detailBarang && (
            <>
              <DrawerHeader className="gap-1">
                <DrawerTitle>{detailBarang.serialNumber}</DrawerTitle>
                <DrawerDescription>
                  Detail identitas unit dan rantai histori pergerakan
                </DrawerDescription>
              </DrawerHeader>

              <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                {/* Metadata */}
                <form className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label>Merek</Label>
                      <Input readOnly defaultValue={detailBarang.merek} />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label>Kategori</Label>
                      <Input readOnly defaultValue={detailBarang.kategori} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label>Status Gudang</Label>
                    <Input readOnly defaultValue={getStatusBadgeProps(detailBarang.status).text} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label>Lokasi Aktif</Label>
                    <Input readOnly defaultValue={detailBarang.lokasiPenyimpanan} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <Label>Tanggal Masuk</Label>
                      <Input readOnly defaultValue={detailBarang.tanggalMasuk} />
                    </div>
                    <div className="flex flex-col gap-3">
                      <Label>Tanggal Keluar</Label>
                      <Input readOnly defaultValue={formatTanggal(detailBarang.tanggalKeluar || "")} />
                    </div>
                  </div>
                </form>

                {/* Ledger Timeline */}
                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex gap-2 leading-none font-medium">
                    Rantai Histori Pergerakan
                  </div>
                  <div>
                    {recentRiwayat.length > 0 ? (
                      <div className="space-y-0">
                        {recentRiwayat.map((riw, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-2.5 h-2.5 shrink-0 rounded-full bg-border border-2 border-muted-foreground mt-1.5" />
                              {idx < recentRiwayat.length - 1 && (
                                <div className="w-px h-full bg-border my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-6 last:pb-1">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <span className="font-medium text-foreground">{riw.tipe}</span>
                                <span className="text-xs text-muted-foreground">{riw.tanggal}</span>
                              </div>
                              <div className="text-muted-foreground mb-2.5">
                                {riw.nomorSurat}
                              </div>
                              <div className="bg-muted/40 rounded-lg p-3 text-xs border border-border/50">
                                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground">
                                  <span>{riw.dariStatus}</span>
                                  <span>&rarr;</span>
                                  <span className="font-medium text-foreground">{riw.keStatus}</span>
                                </div>
                                <div className="text-muted-foreground">
                                  Loc: <span className="font-medium text-foreground">{riw.lokasi}</span>
                                </div>
                              </div>
                              {riw.catatan && (
                                <p className="text-xs italic text-muted-foreground mt-2.5">
                                  {riw.catatan}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        Belum ada riwayat aktivitas tercatat.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">Tutup</Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <AlertDialog open={deleteDialog !== null} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog?.type === "bulk" ? "Hapus beberapa unit?" : "Hapus unit ini?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === "bulk"
                ? `${deleteDialog.ids.length} unit akan dihapus dari sistem. Semua transaksi yang terkait dengan serial number unit tersebut juga akan ikut dihapus.`
                : `Unit dengan SN ${deleteDialog?.serialNumber} akan dihapus dari sistem. Semua transaksi terkait serial number ini juga akan ikut dihapus.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

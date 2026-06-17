"use client"

import { useState, useMemo, useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import {
  Plus,
  Search,
  Filter,
  User,
  MoreVertical,
  Trash2,
  Edit,
  Download,
  Info,
  MapPin,
  Calendar,
  ScanLine,
  History
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { Toaster, toast } from "sonner"
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
  operatorInput: string;
}

interface RiwayatUnit {
  tanggal: string;
  tipe: string;
  nomorSurat: string;
  dariStatus: string;
  keStatus: string;
  lokasi: string;
  oleh: string;
  catatan?: string;
}

const INITIAL_UNITS: BarangUnit[] = [
  { id: "1", serialNumber: "HW2026-00001", kategori: "Networking", merek: "Huawei", status: "Masuk", lokasiPenyimpanan: "Kardus K-01", tanggalMasuk: "2026-06-01", operatorInput: "Rakha Al-Hafiz" },
  { id: "2", serialNumber: "HW2026-00002", kategori: "Networking", merek: "Huawei", status: "Keluar", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 2", tanggalMasuk: "2026-06-01", tanggalKeluar: "2026-06-13", operatorInput: "Rakha Al-Hafiz" },
  { id: "3", serialNumber: "HW2026-00010", kategori: "Networking", merek: "Huawei", status: "Masuk", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 1", tanggalMasuk: "2026-06-01", operatorInput: "Rakha Al-Hafiz" },
  { id: "4", serialNumber: "HW2026-00011", kategori: "Networking", merek: "Huawei", status: "Keluar", lokasiPenyimpanan: "Rak B2 - Aksesoris - Level 1", tanggalMasuk: "2026-05-15", tanggalKeluar: "2026-06-05", operatorInput: "Putri Lestari" },
  { id: "5", serialNumber: "HW2026-00020", kategori: "Networking", merek: "Huawei", status: "Masuk", lokasiPenyimpanan: "Kardus K-01", tanggalMasuk: "2026-06-01", operatorInput: "Rakha Al-Hafiz" },
  { id: "6", serialNumber: "HW2026-00021", kategori: "Networking", merek: "Huawei", status: "Keluar", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 2", tanggalMasuk: "2026-06-02", tanggalKeluar: "2026-06-10", operatorInput: "Putri Lestari" },
  { id: "7", serialNumber: "HW2026-00022", kategori: "Networking", merek: "Huawei", status: "Rusak", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 1", tanggalMasuk: "2026-05-20", tanggalKeluar: "2026-06-08", operatorInput: "Rakha Al-Hafiz" },
  { id: "8", serialNumber: "HW2026-00031", kategori: "Komputer", merek: "Huawei", status: "Keluar", lokasiPenyimpanan: "Rak B2 - Aksesoris - Level 1", tanggalMasuk: "2026-05-15", tanggalKeluar: "2026-06-01", operatorInput: "Putri Lestari" },
]

const MOCK_RIWAYAT: Record<string, RiwayatUnit[]> = {
  "1": [
    { tanggal: "2026-06-01", tipe: "Masuk", nomorSurat: "IN-20260601-001", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Kardus K-01", oleh: "Rakha Al-Hafiz", catatan: '"Batch awal bulan dari logistik pusat"' }
  ],
  "2": [
    { tanggal: "2026-06-13", tipe: "Terpasang", nomorSurat: "OUT-20260613-001", dariStatus: "Tersedia", keStatus: "Terpasang", lokasi: "Rak A1 - Elektronik - Level 2", oleh: "Erdin Saputra", catatan: '"Pemasangan access point cadangan"' },
    { tanggal: "2026-06-01", tipe: "Masuk", nomorSurat: "IN-20260601-001", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Kardus K-01", oleh: "Rakha Al-Hafiz", catatan: '"Batch awal bulan dari logistik pusat"' }
  ],
  "3": [
    { tanggal: "2026-06-01", tipe: "Masuk", nomorSurat: "IN-20260601-001", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Rak A1 - Elektronik - Level 1", oleh: "Rakha Al-Hafiz", catatan: '"Batch awal bulan dari logistik pusat"' }
  ],
  "4": [
    { tanggal: "2026-06-05", tipe: "Dipinjam", nomorSurat: "OUT-20260605-001", dariStatus: "Tersedia", keStatus: "Dipinjam", lokasi: "Rak B2 - Aksesoris - Level 1", oleh: "Putri Lestari", catatan: '"Peminjaman untuk keperluan deployment onsite"' },
    { tanggal: "2026-05-15", tipe: "Masuk", nomorSurat: "IN-20260515-002", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Rak B2 - Aksesoris - Level 1", oleh: "Rakha Al-Hafiz", catatan: '"Pengadaan unit baru"' }
  ],
  "5": [
    { tanggal: "2026-06-01", tipe: "Masuk", nomorSurat: "IN-20260601-001", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Kardus K-01", oleh: "Rakha Al-Hafiz", catatan: '"Batch awal bulan dari logistik pusat"' }
  ],
  "6": [
    { tanggal: "2026-06-10", tipe: "Terpasang", nomorSurat: "OUT-20260610-001", dariStatus: "Tersedia", keStatus: "Terpasang", lokasi: "Rak A1 - Elektronik - Level 2", oleh: "Putri Lestari", catatan: '"Instalasi access point lobby utama"' },
    { tanggal: "2026-06-02", tipe: "Masuk", nomorSurat: "IN-20260602-001", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Kardus K-01", oleh: "Rakha Al-Hafiz", catatan: '"Unit cadangan baru"' }
  ],
  "7": [
    { tanggal: "2026-06-08", tipe: "Rusak", nomorSurat: "ERR-20260608-001", dariStatus: "Tersedia", keStatus: "Rusak", lokasi: "Rak A1 - Elektronik - Level 1", oleh: "Erdin Saputra", catatan: '"Gagal fungsi ethernet port setelah kena lonjakan listrik"' },
    { tanggal: "2026-05-20", tipe: "Masuk", nomorSurat: "IN-20260520-001", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Kardus K-01", oleh: "Rakha Al-Hafiz", catatan: '"Pengadaan unit baru"' }
  ],
  "8": [
    { tanggal: "2026-06-01", tipe: "Dipinjam", nomorSurat: "OUT-20260601-001", dariStatus: "Tersedia", keStatus: "Dipinjam", lokasi: "Rak B2 - Aksesoris - Level 1", oleh: "Putri Lestari", catatan: '"Laptop kerja sementara staff finance"' },
    { tanggal: "2026-05-15", tipe: "Masuk", nomorSurat: "IN-20260515-001", dariStatus: "Keluar", keStatus: "Tersedia", lokasi: "Kardus K-01", oleh: "Rakha Al-Hafiz", catatan: '"Pengadaan laptop baru"' }
  ]
}

const STATUS_OPTIONS: StatusUnit[] = ["Masuk", "Keluar", "Rusak"]

const LOKASI_OPTIONS = [
  "Rak A1 - Elektronik - Level 1",
  "Rak A1 - Elektronik - Level 2",
  "Rak A1 - Elektronik - Level 3",
  "Kardus K-01",
  "Rak B2 - Aksesoris - Level 1"
]

const KATEGORI_OPTIONS = [
  "Networking",
  "Komputer",
  "Aksesoris",
  "Elektronik",
  "Perangkat Keras"
]

export default function DataBarangPage() {
  const isMobile = useIsMobile()
  const [barangList, setBarangList] = useState<BarangUnit[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const loadBarang = async () => {
    try {
      const data = await invoke<BarangUnit[]>("get_items")
      setBarangList(data)
    } catch (error) {
      console.error("Failed to fetch items:", error)
      toast.error("Gagal memuat data barang.")
    }
  }

  useEffect(() => {
    loadBarang()
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
    operatorInput: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailBarang, setDetailBarang] = useState<BarangUnit | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const resetForm = () => {
    setFormData({
      serialNumber: "",
      kategori: "",
      merek: "",
      status: "Masuk",
      lokasiPenyimpanan: "",
      tanggalMasuk: new Date().toISOString().slice(0, 10),
      tanggalKeluar: "",
      operatorInput: ""
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
      lokasiPenyimpanan: barang.lokasiPenyimpanan,
      tanggalMasuk: barang.tanggalMasuk,
      tanggalKeluar: barang.tanggalKeluar || "",
      operatorInput: barang.operatorInput
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
    try {
      await invoke("delete_item", { id })
      setBarangList(prev => prev.filter(b => b.id !== id))
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
      toast.success(`Unit dengan SN ${barang.serialNumber} berhasil dihapus dari sistem.`)
    } catch (error) {
      toast.error("Gagal menghapus unit.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!formData.serialNumber.trim()) errors.serialNumber = "Serial number wajib diisi"
    if (!formData.kategori.trim()) errors.kategori = "Kategori wajib diisi"
    if (!formData.merek.trim()) errors.merek = "Merek barang wajib diisi"
    if (!formData.lokasiPenyimpanan.trim()) errors.lokasiPenyimpanan = "Lokasi penyimpanan wajib diisi"
    if (!formData.tanggalMasuk.trim()) errors.tanggalMasuk = "Tanggal masuk wajib diisi"
    if (!formData.operatorInput.trim()) errors.operatorInput = "Operator input wajib diisi"

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
        lokasiPenyimpanan: formData.lokasiPenyimpanan,
        tanggalMasuk: formData.tanggalMasuk,
        tanggalKeluar: formData.tanggalKeluar || undefined,
        operatorInput: formData.operatorInput
      }
      try {
        await invoke("add_item", { item: newBarang })
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
        lokasiPenyimpanan: formData.lokasiPenyimpanan,
        tanggalMasuk: formData.tanggalMasuk,
        tanggalKeluar: formData.tanggalKeluar || undefined,
        operatorInput: formData.operatorInput
      }
      try {
        await invoke("update_item", { item: updatedBarang })
        setBarangList(prev => prev.map(b => b.id === originalBarang.id ? updatedBarang : b))
        toast.success(`Unit dengan SN ${formData.serialNumber.toUpperCase()} berhasil diperbarui!`)
      } catch (error) {
        toast.error("Gagal memperbarui unit.")
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
        b.lokasiPenyimpanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.operatorInput.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || b.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [barangList, searchTerm, filterStatus])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredBarang.map(b => b.id))
    } else {
      setSelectedIds([])
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
    try {
      for (const id of selectedIds) {
        await invoke("delete_item", { id })
      }
      setBarangList(prev => prev.filter(b => !selectedIds.includes(b.id)))
      setSelectedIds([])
      toast.success(`${selectedIds.length} unit berhasil dihapus dari sistem.`)
    } catch (error) {
      toast.error("Gagal menghapus beberapa unit.")
    }
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

  const handleExport = (type: "Excel" | "PDF") => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Sedang mengekspor data unit ${type}...`,
        success: `Data unit barang berhasil diunduh dalam format ${type}!`,
        error: "Gagal memproses ekspor data.",
      }
    )
  }

  const recentRiwayat = useMemo(() => {
    if (!detailBarang) return []
    return MOCK_RIWAYAT[detailBarang.id] || []
  }, [detailBarang])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Filter and Search Section */}
      <Card className="p-4">
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
            <Button variant="outline" onClick={() => handleExport("Excel")}>
              <Download className="size-4" />
              <span>Export Data</span>
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
      <div className="rounded-lg border bg-card/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[50px] text-center">No.</TableHead>
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={filteredBarang.length > 0 && selectedIds.length === filteredBarang.length}
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
            {filteredBarang.length > 0 ? (
              filteredBarang.map((item, index) => {
                const badge = getStatusBadgeProps(item.status)
                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                    data-state={selectedIds.includes(item.id) ? "selected" : undefined}
                  >
                    <TableCell className="text-center font-medium">
                      {index + 1}
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
                <TableCell colSpan={10} className="h-28 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="size-6 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Data unit kosong atau pencarian tidak ditemukan.</p>
                    <p className="text-xs">Ubah kata kunci atau reset filter Anda.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
                    {KATEGORI_OPTIONS.map((cat) => (
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
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as StatusUnit }))}
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
                      {LOKASI_OPTIONS.map((loc) => (
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

              {/* Operator Input */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="operatorInput">Operator Input</Label>
                <Input
                  id="operatorInput"
                  placeholder="Nama petugas yang menginput data..."
                  value={formData.operatorInput}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, operatorInput: e.target.value }))
                    if (formErrors.operatorInput) {
                      setFormErrors(prev => { const next = { ...prev }; delete next.operatorInput; return next })
                    }
                  }}
                  className={formErrors.operatorInput ? "border-destructive" : ""}
                />
                {formErrors.operatorInput && (
                  <p className="text-[11px] text-destructive font-medium">{formErrors.operatorInput}</p>
                )}
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
                      <Input readOnly defaultValue={(() => {
                        const exitAction = recentRiwayat.find(r => r.tipe !== "Masuk")
                        return exitAction ? exitAction.tanggal : "-"
                      })()} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Label>Petugas Terdaftar</Label>
                    <Input readOnly defaultValue={detailBarang.operatorInput} />
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

    </div>
  )
}
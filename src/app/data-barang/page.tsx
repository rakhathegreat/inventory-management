"use client"

import { useState, useMemo } from "react"
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

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Toaster, toast } from "sonner"
import { Link } from "react-router-dom"

type StatusUnit = "Tersedia" | "Terpasang" | "Dipinjam" | "Rusak" | "Maintenance"

interface BarangUnit {
  id: string;
  serialNumber: string;
  merek: string;
  status: StatusUnit;
  lokasiPenyimpanan: string;
  tanggalMasuk: string;
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
  { id: "1", serialNumber: "HW2026-00001", merek: "Huawei", status: "Tersedia", lokasiPenyimpanan: "Kardus K-01", tanggalMasuk: "2026-06-01", operatorInput: "Rakha Al-Hafiz" },
  { id: "2", serialNumber: "HW2026-00002", merek: "Huawei", status: "Terpasang", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 2", tanggalMasuk: "2026-06-01", operatorInput: "Rakha Al-Hafiz" },
  { id: "3", serialNumber: "HW2026-00010", merek: "Huawei", status: "Tersedia", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 1", tanggalMasuk: "2026-06-01", operatorInput: "Rakha Al-Hafiz" },
  { id: "4", serialNumber: "HW2026-00011", merek: "Huawei", status: "Dipinjam", lokasiPenyimpanan: "Rak B2 - Aksesoris - Level 1", tanggalMasuk: "2026-05-15", operatorInput: "Putri Lestari" },
  { id: "5", serialNumber: "HW2026-00020", merek: "Huawei", status: "Tersedia", lokasiPenyimpanan: "Kardus K-01", tanggalMasuk: "2026-06-01", operatorInput: "Rakha Al-Hafiz" },
  { id: "6", serialNumber: "HW2026-00021", merek: "Huawei", status: "Terpasang", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 2", tanggalMasuk: "2026-06-02", operatorInput: "Putri Lestari" },
  { id: "7", serialNumber: "HW2026-00022", merek: "Huawei", status: "Rusak", lokasiPenyimpanan: "Rak A1 - Elektronik - Level 1", tanggalMasuk: "2026-05-20", operatorInput: "Rakha Al-Hafiz" },
  { id: "8", serialNumber: "HW2026-00031", merek: "Huawei", status: "Dipinjam", lokasiPenyimpanan: "Rak B2 - Aksesoris - Level 1", tanggalMasuk: "2026-05-15", operatorInput: "Putri Lestari" },
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

const STATUS_OPTIONS: StatusUnit[] = ["Tersedia", "Terpasang", "Dipinjam", "Rusak", "Maintenance"]

const LOKASI_OPTIONS = [
  "Rak A1 - Elektronik - Level 1",
  "Rak A1 - Elektronik - Level 2",
  "Rak A1 - Elektronik - Level 3",
  "Kardus K-01",
  "Rak B2 - Aksesoris - Level 1"
]

export default function DataBarangPage() {
  const [barangList, setBarangList] = useState<BarangUnit[]>(INITIAL_UNITS)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [selectedBarang, setSelectedBarang] = useState<BarangUnit | null>(null)
  const [formData, setFormData] = useState({
    serialNumber: "",
    merek: "",
    status: "Tersedia" as StatusUnit,
    lokasiPenyimpanan: "",
    tanggalMasuk: "",
    operatorInput: ""
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailBarang, setDetailBarang] = useState<BarangUnit | null>(null)

  const resetForm = () => {
    setFormData({
      serialNumber: "",
      merek: "",
      status: "Tersedia",
      lokasiPenyimpanan: "",
      tanggalMasuk: new Date().toISOString().slice(0, 10),
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
      merek: barang.merek,
      status: barang.status,
      lokasiPenyimpanan: barang.lokasiPenyimpanan,
      tanggalMasuk: barang.tanggalMasuk,
      operatorInput: barang.operatorInput
    })
    setFormErrors({})
    setIsFormOpen(true)
  }

  const handleOpenDetail = (barang: BarangUnit) => {
    setDetailBarang(barang)
    setIsDetailOpen(true)
  }

  const handleDelete = (id: string) => {
    const barang = barangList.find(b => b.id === id)
    if (!barang) return
    setBarangList(prev => prev.filter(b => b.id !== id))
    toast.success(`Unit dengan SN ${barang.serialNumber} berhasil dihapus dari sistem.`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!formData.serialNumber.trim()) errors.serialNumber = "Serial number wajib diisi"
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
        merek: formData.merek,
        status: formData.status,
        lokasiPenyimpanan: formData.lokasiPenyimpanan,
        tanggalMasuk: formData.tanggalMasuk,
        operatorInput: formData.operatorInput
      }
      setBarangList(prev => [newBarang, ...prev])
      toast.success(`Unit baru dengan SN ${newBarang.serialNumber} berhasil didaftarkan!`)
    } else {
      const originalBarang = selectedBarang!
      setBarangList(prev => prev.map(b => {
        if (b.id === originalBarang.id) {
          return {
            ...b,
            serialNumber: formData.serialNumber.toUpperCase(),
            merek: formData.merek,
            status: formData.status,
            lokasiPenyimpanan: formData.lokasiPenyimpanan,
            tanggalMasuk: formData.tanggalMasuk,
            operatorInput: formData.operatorInput
          }
        }
        return b
      }))
      toast.success(`Unit dengan SN ${formData.serialNumber.toUpperCase()} berhasil diperbarui!`)
    }

    setIsFormOpen(false)
    resetForm()
  }

  const filteredBarang = useMemo(() => {
    return barangList.filter(b => {
      const matchesSearch =
        b.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.merek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.lokasiPenyimpanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.operatorInput.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || b.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [barangList, searchTerm, filterStatus])

  const getStatusBadgeProps = (status: StatusUnit) => {
    switch (status) {
      case "Tersedia":
        return { text: "Tersedia", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }
      case "Terpasang":
        return { text: "Terpasang", className: "bg-sky-500/10 text-sky-500 border-sky-500/20" }
      case "Dipinjam":
        return { text: "Dipinjam", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" }
      case "Rusak":
        return { text: "Rusak", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
      case "Maintenance":
      default:
        return { text: "Maintenance", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" }
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
      <Toaster richColors position="top-right" />

      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Data Unit Barang
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau setiap unit barang berdasarkan serial number, status fisik, lokasi penyimpanan, dan riwayat aktivitasnya.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button variant="outline" size="sm" onClick={() => handleExport("Excel")}>
            <Download className="size-4" />
            <span>Export Data</span>
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <Link to="/barang-masuk" className="flex flex-row items-center">
              <Plus className="size-4" />
              <span>Tambah Unit Baru</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <Card className="border bg-card/30 backdrop-blur-sm p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari serial number, merek, lokasi..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Filter className="size-3.5" />
              <span>Filter:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] h-9">
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
                className="h-9 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
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
      </Card>

      {/* Data Table */}
      <div className="rounded-lg border bg-card/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[170px]">Serial Number (SN)</TableHead>
              <TableHead className="w-[140px]">Merek</TableHead>
              <TableHead className="text-center w-[120px]">Status</TableHead>
              <TableHead>Lokasi Penyimpanan</TableHead>
              <TableHead className="hidden md:table-cell w-[130px]">Tanggal Masuk</TableHead>
              <TableHead className="hidden lg:table-cell w-[150px]">Operator Input</TableHead>
              <TableHead className="w-[60px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBarang.length > 0 ? (
              filteredBarang.map((item) => {
                const badge = getStatusBadgeProps(item.status)
                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-primary">
                        {item.serialNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm leading-tight">
                        {item.merek}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10.5px] font-semibold border px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" />
                        <span>{item.lokasiPenyimpanan}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        <span>{formatTanggal(item.tanggalMasuk)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3.5" />
                        <span>{item.operatorInput}</span>
                      </div>
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
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
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

      {/* Add / Edit Sheet Form */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-md flex flex-col h-full bg-card">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>
              {formMode === "add" ? "Registrasi Unit Baru" : "Edit Informasi Unit"}
            </SheetTitle>
            <SheetDescription>
              Isi data detail berikut untuk mendaftarkan atau memutakhirkan unit barang berdasarkan serial number di sistem gudang.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 pr-1 -mr-1">
            <form onSubmit={handleSubmit} className="space-y-4 py-4 px-1">

              {/* Serial Number */}
              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="text-xs font-semibold">Serial Number (SN)</Label>
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
                    className={`h-9 pl-9 font-mono text-xs ${formErrors.serialNumber ? "border-destructive" : ""}`}
                  />
                </div>
                {formErrors.serialNumber && (
                  <p className="text-[11px] text-destructive font-medium mt-0.5">{formErrors.serialNumber}</p>
                )}
              </div>

              {/* Merek */}
              <div className="space-y-2">
                <Label htmlFor="merek" className="text-xs font-semibold">Merek</Label>
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
                  className={`h-9 ${formErrors.merek ? "border-destructive" : ""}`}
                />
                {formErrors.merek && (
                  <p className="text-[11px] text-destructive font-medium mt-0.5">{formErrors.merek}</p>
                )}
              </div>

              {/* Status & Tanggal Masuk */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-semibold">Status Unit</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as StatusUnit }))}
                  >
                    <SelectTrigger id="status" className="h-9">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalMasuk" className="text-xs font-semibold">Tanggal Masuk</Label>
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
                    className={`h-9 ${formErrors.tanggalMasuk ? "border-destructive" : ""}`}
                  />
                  {formErrors.tanggalMasuk && (
                    <p className="text-[11px] text-destructive font-medium mt-0.5">{formErrors.tanggalMasuk}</p>
                  )}
                </div>
              </div>

              {/* Lokasi Penyimpanan */}
              <div className="space-y-2">
                <Label htmlFor="lokasiPenyimpanan" className="text-xs font-semibold">Lokasi Penyimpanan</Label>
                <Select
                  value={formData.lokasiPenyimpanan}
                  onValueChange={(val) => {
                    setFormData(prev => ({ ...prev, lokasiPenyimpanan: val }))
                    if (formErrors.lokasiPenyimpanan) {
                      setFormErrors(prev => { const next = { ...prev }; delete next.lokasiPenyimpanan; return next })
                    }
                  }}
                >
                  <SelectTrigger id="lokasiPenyimpanan" className="h-9">
                    <SelectValue placeholder="Pilih lokasi penyimpanan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOKASI_OPTIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.lokasiPenyimpanan && (
                  <p className="text-[11px] text-destructive font-medium mt-0.5">{formErrors.lokasiPenyimpanan}</p>
                )}
              </div>

              {/* Operator Input */}
              <div className="space-y-2">
                <Label htmlFor="operatorInput" className="text-xs font-semibold">Operator Input</Label>
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
                  className={`h-9 ${formErrors.operatorInput ? "border-destructive" : ""}`}
                />
                {formErrors.operatorInput && (
                  <p className="text-[11px] text-destructive font-medium mt-0.5">{formErrors.operatorInput}</p>
                )}
              </div>

              <SheetFooter className="pt-4 border-t flex flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold shadow-md transition-all active:scale-[0.98]"
                >
                  Simpan Unit
                </Button>
              </SheetFooter>
            </form>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Detail Drawer */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="right" className="sm:max-w-md flex flex-col h-full bg-card border-l border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl">
          {detailBarang && (
            <>
              <div className="flex flex-col gap-1 pb-4 border-b border-slate-100 dark:border-slate-800 pr-8">
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase">
                  DETAIL IDENTITAS UNIT
                </span>
                <SheetTitle className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-50 tracking-tight leading-none">
                  {detailBarang.serialNumber}
                </SheetTitle>
              </div>

              <ScrollArea className="flex-1 pr-1 -mr-1 mt-4">
                <div className="space-y-6 pb-2 px-1">

                  {/* Metadata Card */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Merek</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm font-bold block">{detailBarang.merek}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-1">Status Gudang</span>
                      <div>
                        {(() => {
                          const badge = getStatusBadgeProps(detailBarang.status)
                          return (
                            <Badge className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-full ${badge.className}`}>
                              {badge.text}
                            </Badge>
                          )
                        })()}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Lokasi Aktif</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm font-bold flex items-center gap-1">
                        <MapPin className="size-3.5 text-sky-500" />
                        {detailBarang.lokasiPenyimpanan}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Lokasi Terakhir</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm font-bold block">
                        {recentRiwayat.length > 1 ? recentRiwayat[1].lokasi : "-"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Tanggal Masuk</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm font-bold block">{detailBarang.tanggalMasuk}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Tanggal Keluar</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm font-bold block">
                        {(() => {
                          const exitAction = recentRiwayat.find(r => r.tipe !== "Masuk")
                          return exitAction ? exitAction.tanggal : "-"
                        })()}
                      </strong>
                    </div>

                    <div className="col-span-2">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-0.5">Petugas Terdaftar</span>
                      <strong className="text-slate-800 dark:text-slate-200 text-sm font-bold block">{detailBarang.operatorInput}</strong>
                    </div>
                  </div>

                  {/* Ledger Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="size-4 text-slate-400 dark:text-slate-500" />
                      RANTAI HISTORI PERGERAKAN (LEDGER)
                    </h3>
                    <div className="pl-1">
                      {recentRiwayat.length > 0 ? (
                        recentRiwayat.map((riw, idx) => (
                          <div key={idx} className="relative pl-7 pb-6 last:pb-1">
                            {idx < recentRiwayat.length - 1 && (
                              <div className="absolute left-[7px] top-[22px] bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800/80" />
                            )}
                            <div className="absolute left-0 top-[6px] w-4 h-4 rounded-full border border-sky-300 dark:border-sky-500/50 flex items-center justify-center bg-white dark:bg-slate-900 shadow-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{riw.tipe}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{riw.tanggal}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                {riw.nomorSurat} ({riw.oleh})
                              </div>
                              <div className="mt-1.5 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-mono flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <span className="text-slate-400 dark:text-slate-500">{riw.dariStatus}</span>
                                <span className="text-slate-300 dark:text-slate-700">→</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{riw.keStatus}</span>
                                <span className="text-slate-300 dark:text-slate-700">|</span>
                                <span>Loc: <span className="text-slate-700 dark:text-slate-300 font-medium">{riw.lokasi}</span></span>
                              </div>
                              {riw.catatan && (
                                <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-1.5 px-1 leading-snug">
                                  {riw.catatan}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/20 dark:bg-slate-900/10 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                          Belum ada riwayat aktivitas tercatat untuk unit ini.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  )
}
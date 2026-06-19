"use client"

import { useEffect, useMemo, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import {
  Building2,
  Edit,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

type PartnerType = "Supplier" | "Vendor" | "Jasa" | "Lainnya"

type Partner = {
  id: string
  name: string
  partnerType: PartnerType
  contactPerson: string
  phone: string
  email: string
  address: string
  isActive: boolean
}

const PARTNER_TYPES: PartnerType[] = ["Supplier", "Vendor", "Jasa", "Lainnya"]

const initialForm = {
  name: "",
  partnerType: "Supplier" as PartnerType,
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  isActive: true,
}

export default function MitraPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null)

  const loadPartners = async () => {
    try {
      const data = await invoke<Partner[]>("get_partners")
      setPartners(data)
    } catch (error) {
      console.error("Gagal memuat data mitra:", error)
      toast.error("Gagal memuat data mitra.")
    }
  }

  useEffect(() => {
    loadPartners()
  }, [])

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return partners.filter((partner) => {
      const matchesSearch =
        !query ||
        partner.name.toLowerCase().includes(query) ||
        partner.contactPerson.toLowerCase().includes(query) ||
        partner.phone.toLowerCase().includes(query) ||
        partner.email.toLowerCase().includes(query) ||
        partner.address.toLowerCase().includes(query)
      const matchesType =
        typeFilter === "all" || partner.partnerType === typeFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? partner.isActive : !partner.isActive)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [partners, searchQuery, statusFilter, typeFilter])

  const openAddSheet = () => {
    setEditId(null)
    setFormData(initialForm)
    setFormErrors({})
    setIsSheetOpen(true)
  }

  const openEditSheet = (partner: Partner) => {
    setEditId(partner.id)
    setFormData({
      name: partner.name,
      partnerType: partner.partnerType,
      contactPerson: partner.contactPerson === "-" ? "" : partner.contactPerson,
      phone: partner.phone === "-" ? "" : partner.phone,
      email: partner.email === "-" ? "" : partner.email,
      address: partner.address === "-" ? "" : partner.address,
      isActive: partner.isActive,
    })
    setFormErrors({})
    setIsSheetOpen(true)
  }

  const handleSave = async () => {
    const errors: Record<string, string> = {}
    const normalizedName = formData.name.trim()
    const normalizedEmail = formData.email.trim()

    if (!normalizedName) {
      errors.name = "Nama mitra wajib diisi."
    }
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      errors.email = "Format email tidak valid."
    }

    const hasDuplicateName = partners.some(
      (partner) =>
        partner.name.trim().toLowerCase() === normalizedName.toLowerCase() &&
        partner.id !== editId
    )
    if (hasDuplicateName) {
      errors.name = "Nama mitra sudah terdaftar."
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Periksa kembali data mitra.")
      return
    }

    const partner: Partner = {
      id: editId || `mitra-${Date.now()}`,
      name: normalizedName,
      partnerType: formData.partnerType,
      contactPerson: formData.contactPerson.trim() || "-",
      phone: formData.phone.trim() || "-",
      email: normalizedEmail || "-",
      address: formData.address.trim() || "-",
      isActive: formData.isActive,
    }

    try {
      await invoke(editId ? "update_partner" : "add_partner", { partner })
      await loadPartners()
      setIsSheetOpen(false)
      toast.success(
        editId ? "Data mitra berhasil diperbarui." : "Mitra baru berhasil ditambahkan."
      )
    } catch (error) {
      console.error("Gagal menyimpan data mitra:", error)
      toast.error("Gagal menyimpan data mitra.")
    }
  }

  const handleToggleStatus = async (partner: Partner) => {
    try {
      await invoke("update_partner", {
        partner: {
          ...partner,
          isActive: !partner.isActive,
        },
      })
      await loadPartners()
      toast.success(
        `Mitra berhasil ${partner.isActive ? "dinonaktifkan" : "diaktifkan"}.`
      )
    } catch (error) {
      console.error("Gagal mengubah status mitra:", error)
      toast.error("Gagal mengubah status mitra.")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await invoke("delete_partner", { id: deleteTarget.id })
      await loadPartners()
      setDeleteTarget(null)
      toast.success("Mitra berhasil dihapus.")
    } catch (error) {
      console.error("Gagal menghapus mitra:", error)
      toast.error("Gagal menghapus mitra.")
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-6 lg:p-8">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari mitra, PIC, telepon..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Jenis mitra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {PARTNER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={openAddSheet} className="gap-2">
            <Plus className="size-4" />
            Tambah Mitra
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPartners.map((partner) => (
          <Card key={partner.id} className="group overflow-hidden">
            <CardContent className="flex h-full flex-col gap-5 px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{partner.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="secondary">{partner.partnerType}</Badge>
                      <Badge
                        variant="outline"
                        className={partner.isActive ? "text-emerald-500" : "text-muted-foreground"}
                      >
                        {partner.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Menu mitra</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditSheet(partner)}>
                      <Edit className="size-4" />
                      Edit Mitra
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(partner)}>
                      {partner.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget(partner)}
                    >
                      <Trash2 className="size-4" />
                      Hapus Mitra
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{partner.contactPerson}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{partner.phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="break-all">{partner.email}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{partner.address}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPartners.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Building2 className="size-7" />
              </div>
              <div>
                <p className="font-semibold">Mitra tidak ditemukan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ubah filter pencarian atau tambahkan mitra baru.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editId ? "Edit Mitra" : "Tambah Mitra"}</SheetTitle>
            <SheetDescription>
              Kelola identitas dan informasi kontak mitra perusahaan.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">Nama Mitra</Label>
              <Input
                id="partner-name"
                value={formData.name}
                onChange={(event) => {
                  setFormData((current) => ({ ...current, name: event.target.value }))
                  setFormErrors((current) => ({ ...current, name: "" }))
                }}
                placeholder="Contoh: PT Telkom Indonesia"
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jenis Mitra</Label>
                <Select
                  value={formData.partnerType}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      partnerType: value as PartnerType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      isActive: value === "active",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-person">Penanggung Jawab / PIC</Label>
              <Input
                id="contact-person"
                value={formData.contactPerson}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    contactPerson: event.target.value,
                  }))
                }
                placeholder="Nama kontak utama"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner-phone">Telepon</Label>
                <Input
                  id="partner-phone"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-email">Email</Label>
                <Input
                  id="partner-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => {
                    setFormData((current) => ({ ...current, email: event.target.value }))
                    setFormErrors((current) => ({ ...current, email: "" }))
                  }}
                  placeholder="mitra@email.com"
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-address">Alamat</Label>
              <Input
                id="partner-address"
                value={formData.address}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="Alamat kantor mitra"
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan Mitra</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus mitra?</AlertDialogTitle>
            <AlertDialogDescription>
              Data {deleteTarget?.name} akan dihapus permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

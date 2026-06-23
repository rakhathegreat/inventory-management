"use client"

import { useEffect, useMemo, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import {
  Building2,
  Edit,
  Fingerprint,
  KeyRound,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PartnerType = "Supplier" | "Vendor" | "Jasa" | "Lainnya"

type Partner = {
  id: string
  code: string
  name: string
  partnerType: PartnerType
  contactPerson: string
  phone: string
  email: string
  address: string
  isActive: boolean
  username?: string | null
}

type OwnerIdentitySettings = {
  kpCode: string
}

const PARTNER_TYPES: PartnerType[] = ["Supplier", "Vendor", "Jasa", "Lainnya"]
const normalizeIdentityCode = (value: string) => value.trim().toUpperCase()

const initialForm = {
  code: "",
  name: "",
  partnerType: "Supplier" as PartnerType,
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  isActive: true,
  username: "",
  password: "",
  confirmPassword: "",
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
  const [kpCode, setKpCode] = useState("KP")
  const [kpCodeDraft, setKpCodeDraft] = useState("KP")
  const [kpCodeError, setKpCodeError] = useState("")
  const [isKpCodeDialogOpen, setIsKpCodeDialogOpen] = useState(false)

  const loadPartners = async () => {
    try {
      const data = await invoke<Partner[]>("get_partners")
      setPartners(data)
    } catch (error) {
      console.error("Gagal memuat data mitra:", error)
      toast.error("Gagal memuat data mitra.")
    }
  }

  const loadIdentitySettings = async () => {
    try {
      const settings = await invoke<OwnerIdentitySettings>(
        "get_owner_identity_settings"
      )
      setKpCode(settings.kpCode)
      setKpCodeDraft(settings.kpCode)
    } catch (error) {
      console.error("Gagal memuat kode identitas KP:", error)
      toast.error("Gagal memuat kode identitas KP.")
    }
  }

  useEffect(() => {
    loadPartners()
    loadIdentitySettings()
  }, [])

  const filteredPartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return partners.filter((partner) => {
      const matchesSearch =
        !query ||
        partner.code.toLowerCase().includes(query) ||
        partner.name.toLowerCase().includes(query) ||
        partner.contactPerson.toLowerCase().includes(query) ||
        partner.phone.toLowerCase().includes(query) ||
        partner.email.toLowerCase().includes(query) ||
        partner.address.toLowerCase().includes(query) ||
        partner.username?.toLowerCase().includes(query)
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
      code: partner.code,
      name: partner.name,
      partnerType: partner.partnerType,
      contactPerson: partner.contactPerson === "-" ? "" : partner.contactPerson,
      phone: partner.phone === "-" ? "" : partner.phone,
      email: partner.email === "-" ? "" : partner.email,
      address: partner.address === "-" ? "" : partner.address,
      isActive: partner.isActive,
      username: partner.username || "",
      password: "",
      confirmPassword: "",
    })
    setFormErrors({})
    setIsSheetOpen(true)
  }

  const handleSave = async () => {
    const errors: Record<string, string> = {}
    const normalizedName = formData.name.trim()
    const normalizedEmail = formData.email.trim()
    const normalizedUsername = formData.username.trim()
    const normalizedCode = normalizeIdentityCode(formData.code)

    if (
      normalizedCode.length < 2 ||
      normalizedCode.length > 30 ||
      !/^[A-Z0-9_-]+$/.test(normalizedCode)
    ) {
      errors.code =
        "Kode harus 2-30 karakter dan hanya berisi huruf, angka, - atau _."
    }
    if (!normalizedName) {
      errors.name = "Nama mitra wajib diisi."
    }
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      errors.email = "Format email tidak valid."
    }
    if (normalizedUsername.length < 4) {
      errors.username = "Username minimal 4 karakter."
    }
    if (!editId && formData.password.length < 8) {
      errors.password = "Password minimal 8 karakter."
    }
    if (editId && formData.password && formData.password.length < 8) {
      errors.password = "Password minimal 8 karakter."
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password tidak sama."
    }

    const hasDuplicateName = partners.some(
      (partner) =>
        partner.name.trim().toLowerCase() === normalizedName.toLowerCase() &&
        partner.id !== editId
    )
    if (hasDuplicateName) {
      errors.name = "Nama mitra sudah terdaftar."
    }
    const hasDuplicateUsername = partners.some(
      (partner) =>
        partner.username?.trim().toLowerCase() ===
          normalizedUsername.toLowerCase() && partner.id !== editId
    )
    if (hasDuplicateUsername) {
      errors.username = "Username sudah digunakan."
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Periksa kembali data mitra.")
      return
    }

    const partner: Partner = {
      id: editId || `mitra-${Date.now()}`,
      code: normalizedCode,
      name: normalizedName,
      partnerType: formData.partnerType,
      contactPerson: formData.contactPerson.trim() || "-",
      phone: formData.phone.trim() || "-",
      email: normalizedEmail || "-",
      address: formData.address.trim() || "-",
      isActive: formData.isActive,
      username: normalizedUsername,
    }

    try {
      if (editId) {
        await invoke("update_partner_account", {
          partner,
          username: normalizedUsername,
          password: formData.password || null,
        })
      } else {
        await invoke("add_partner_account", {
          partner,
          username: normalizedUsername,
          password: formData.password,
        })
      }
      await loadPartners()
      setIsSheetOpen(false)
      toast.success(
        editId ? "Data mitra berhasil diperbarui." : "Mitra baru berhasil ditambahkan."
      )
    } catch (error) {
      console.error("Gagal menyimpan data mitra:", error)
      toast.error(
        typeof error === "string" ? error : "Gagal menyimpan data mitra."
      )
    }
  }

  const handleSaveKpCode = async () => {
    const normalizedCode = normalizeIdentityCode(kpCodeDraft)
    if (
      normalizedCode.length < 2 ||
      normalizedCode.length > 30 ||
      !/^[A-Z0-9_-]+$/.test(normalizedCode)
    ) {
      setKpCodeError(
        "Kode harus 2-30 karakter dan hanya berisi huruf, angka, - atau _."
      )
      return
    }

    try {
      await invoke("update_kp_identity_code", { code: normalizedCode })
      setKpCode(normalizedCode)
      setKpCodeDraft(normalizedCode)
      setKpCodeError("")
      setIsKpCodeDialogOpen(false)
      toast.success("Kode identitas KP berhasil diperbarui.")
    } catch (error) {
      setKpCodeError(
        typeof error === "string" ? error : "Gagal memperbarui kode KP."
      )
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
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Fingerprint className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Identitas KP</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xl font-semibold">{kpCode}</p>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setKpCodeDraft(kpCode)
              setKpCodeError("")
              setIsKpCodeDialogOpen(true)
            }}
          >
            <Edit className="size-4" />
            Ubah Kode KP
          </Button>
        </CardContent>
      </Card>

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
                      <Badge className="font-mono">{partner.code}</Badge>
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
                  <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {partner.username ? `@${partner.username}` : "Akun belum dibuat"}
                  </span>
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
        <SheetContent className="flex flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editId ? "Edit Mitra" : "Tambah Mitra"}</SheetTitle>
            <SheetDescription>
              Kelola identitas mitra sekaligus akun yang digunakan untuk login.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-4">
            <div className="space-y-2">
              <Label htmlFor="partner-code">Kode Mitra</Label>
              <Input
                id="partner-code"
                value={formData.code}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                  setFormErrors((current) => ({ ...current, code: "" }))
                }}
                placeholder="Contoh: MTR-001"
                className={`font-mono ${
                  formErrors.code ? "border-destructive" : ""
                }`}
              />
              <p className="text-xs text-muted-foreground">
                Kode digunakan sebagai identitas Mitra dan boleh sama dengan
                identitas lain.
              </p>
              {formErrors.code && (
                <p className="text-xs text-destructive">{formErrors.code}</p>
              )}
            </div>

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

            <div className="border-t pt-5">
              <div className="mb-4">
                <h3 className="font-medium">Akun Login Mitra</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Akun ini dibuat oleh admin. Mitra tidak dapat mendaftarkan akun
                  secara mandiri.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="partner-username">Username</Label>
                  <Input
                    id="partner-username"
                    value={formData.username}
                    onChange={(event) => {
                      setFormData((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                      setFormErrors((current) => ({
                        ...current,
                        username: "",
                      }))
                    }}
                    autoComplete="off"
                    placeholder="Minimal 4 karakter"
                    className={formErrors.username ? "border-destructive" : ""}
                  />
                  {formErrors.username && (
                    <p className="text-xs text-destructive">
                      {formErrors.username}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="partner-password">
                      {editId ? "Password Baru" : "Password"}
                    </Label>
                    <Input
                      id="partner-password"
                      type="password"
                      value={formData.password}
                      onChange={(event) => {
                        setFormData((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                        setFormErrors((current) => ({
                          ...current,
                          password: "",
                        }))
                      }}
                      autoComplete="new-password"
                      placeholder={editId ? "Kosongkan jika tetap" : "Minimal 8 karakter"}
                      className={formErrors.password ? "border-destructive" : ""}
                    />
                    {formErrors.password && (
                      <p className="text-xs text-destructive">
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partner-password-confirmation">
                      Konfirmasi Password
                    </Label>
                    <Input
                      id="partner-password-confirmation"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(event) => {
                        setFormData((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                        setFormErrors((current) => ({
                          ...current,
                          confirmPassword: "",
                        }))
                      }}
                      autoComplete="new-password"
                      placeholder="Ulangi password"
                      className={
                        formErrors.confirmPassword ? "border-destructive" : ""
                      }
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>
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

      <Dialog
        open={isKpCodeDialogOpen}
        onOpenChange={setIsKpCodeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah kode identitas KP</DialogTitle>
            <DialogDescription>
              Kode ini menjadi identitas resmi lokasi dan barang milik Admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="kp-identity-code">Kode KP</Label>
            <Input
              id="kp-identity-code"
              value={kpCodeDraft}
              onChange={(event) => {
                setKpCodeDraft(event.target.value.toUpperCase())
                setKpCodeError("")
              }}
              className={`font-mono ${
                kpCodeError ? "border-destructive" : ""
              }`}
              placeholder="Contoh: KP-TSM"
            />
            {kpCodeError && (
              <p className="text-xs text-destructive">{kpCodeError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsKpCodeDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSaveKpCode}>Simpan Kode</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

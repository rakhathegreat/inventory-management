"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, CircleStar, MoreVertical
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Merek = {
  id: string;
  name: string;
  identifier: string;
  origin: string;
  totalItems: number;
};

export default function MerekBarangPage() {
  const [brands, setBrands] = useState<Merek[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Alert state
  const [deleteAlertData, setDeleteAlertData] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: "", name: "" });

  // Form state
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [origin, setOrigin] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadBrands = async () => {
    try {
      const data = await invoke<Merek[]>("get_brands");
      setBrands(data);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter(brand =>
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.origin.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [brands, searchQuery]);

  const handleOpenSheet = (id?: string) => {
    if (id) {
      const brand = brands.find(b => b.id === id);
      if (brand) {
        setName(brand.name);
        setIdentifier(brand.identifier);
        setOrigin(brand.origin);
        setEditId(id);
      }
    } else {
      setName("");
      setIdentifier("");
      setOrigin("");
      setEditId(null);
    }
    setFormErrors({});
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const normalizedIdentifier =
      identifier.trim().toUpperCase() ||
      trimmedName.slice(0, 3).toUpperCase();
    const errors: Record<string, string> = {};

    if (!trimmedName) {
      errors.name = "Nama merek wajib diisi.";
    }
    if (!normalizedIdentifier) {
      errors.identifier = "Identifier merek wajib diisi.";
    }

    const duplicateName = brands.some(
      (brand) =>
        brand.id !== editId &&
        brand.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicateName) {
      errors.name = "Nama merek sudah terdaftar.";
    }

    const duplicateIdentifier = brands.some(
      (brand) =>
        brand.id !== editId &&
        brand.identifier.trim().toLowerCase() === normalizedIdentifier.toLowerCase()
    );
    if (duplicateIdentifier) {
      errors.identifier = "Identifier merek sudah digunakan.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Merek tidak dapat disimpan karena data harus unik.");
      return;
    }

    try {
      if (editId) {
        const brand = brands.find(b => b.id === editId);
        await invoke("update_brand", {
          brand: {
            id: editId,
            name: trimmedName,
            identifier: normalizedIdentifier,
            origin: origin.trim() || "-",
            totalItems: brand?.totalItems || 0
          }
        });
      } else {
        await invoke("add_brand", {
          brand: {
            id: `mrk-${Date.now()}`,
            name: trimmedName,
            identifier: normalizedIdentifier,
            origin: origin.trim() || "-",
            totalItems: 0
          }
        });
      }
      await loadBrands();
      setIsSheetOpen(false);
      toast.success(`Berhasil ${editId ? "menyimpan perubahan" : "menambahkan"} data merek`);
    } catch (error) {
      console.error("Failed to save brand:", error);
      toast.error(typeof error === "string" ? error : "Gagal menyimpan merek.");
    }
  };

  const requestDelete = (id: string, name: string) => {
    setDeleteAlertData({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    const { id } = deleteAlertData;
    if (!id) return;

    try {
      await invoke("delete_brand", { id });
      await loadBrands();
      toast.success("Berhasil menghapus merek");
    } catch (error) {
      console.error("Failed to delete brand:", error);
      toast.error("Gagal menghapus merek.");
    } finally {
      setDeleteAlertData({ isOpen: false, id: "", name: "" });
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 text-neutral-100 mx-auto w-full">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            type="search"
            placeholder="Cari merek atau identifier..."
            className="w-full pl-9 bg-neutral-900 border-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenSheet()}>
          <Plus className="w-4 h-4" /> Tambah Merek
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-10">
        {filteredBrands.map(brand => (
          <Card key={brand.id} className="overflow-hidden relative group transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/60">
            <CardContent className="px-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-orange-500/10 rounded-xl shrink-0">
                  <CircleStar className="w-6 h-6 text-orange-400" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800 text-neutral-200">
                    <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet(brand.id)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Merek
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 focus:bg-red-950/50 focus:text-red-400 cursor-pointer" onClick={() => requestDelete(brand.id, brand.name)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Hapus Merek
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-neutral-100 mb-1">{brand.name}</h3>
                <p className="text-sm text-neutral-500 line-clamp-1">{brand.identifier}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-800/60 flex justify-between items-center">
                <span className="text-xs font-medium text-neutral-500">Total Barang</span>
                <span className="text-sm font-medium text-neutral-300">{brand.totalItems} Unit</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredBrands.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-medium text-neutral-300 mb-1">Merek Tidak Ditemukan</h3>
            <p className="text-sm text-neutral-500 max-w-sm">Coba gunakan kata kunci lain atau tambahkan merek baru.</p>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md border-neutral-800 bg-neutral-950 p-0 flex flex-col text-neutral-200">
          <SheetHeader className="p-6 border-b border-neutral-800/60 bg-neutral-900/20">
            <SheetTitle className="text-xl text-neutral-100">{editId ? "Edit Merek" : "Tambah Merek Baru"}</SheetTitle>
            <SheetDescription className="text-neutral-400">
              Isi formulir di bawah ini untuk mengelola informasi merek barang.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label>Nama Merek</Label>
                <Input
                  value={name}
                  onChange={e => {
                    setName(e.target.value)
                    setFormErrors(current => ({ ...current, name: "" }))
                  }}
                  placeholder="Contoh: Cisco"
                  className={`bg-neutral-900 ${formErrors.name ? "border-destructive" : "border-neutral-800"}`}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Identifier</Label>
                <Input
                  value={identifier}
                  onChange={e => {
                    setIdentifier(e.target.value.toUpperCase())
                    setFormErrors(current => ({ ...current, identifier: "" }))
                  }}
                  placeholder="Contoh: CIS"
                  className={`bg-neutral-900 font-mono uppercase ${formErrors.identifier ? "border-destructive" : "border-neutral-800"}`}
                />
                {formErrors.identifier && (
                  <p className="text-xs text-destructive">{formErrors.identifier}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Asal / Deskripsi</Label>
                <Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Contoh: Amerika Serikat" className="bg-neutral-900 border-neutral-800" />
              </div>
            </div>
          </div>
          <SheetFooter className="p-6 border-t border-neutral-800/60 bg-neutral-900/20 flex sm:justify-end gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="hover:bg-neutral-800 text-neutral-300">Batal</Button>
            <Button onClick={handleSave}>Simpan Perubahan</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteAlertData.isOpen} onOpenChange={(open) => !open && setDeleteAlertData({ ...deleteAlertData, isOpen: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

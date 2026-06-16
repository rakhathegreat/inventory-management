"use client";

import React, { useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, Search, Shapes, MoreVertical
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

type Kategori = {
  id: string;
  name: string;
  description: string;
  totalItems: number;
};

const MOCK_DATA: Kategori[] = [
  { id: "kat-1", name: "Router & Switch", description: "Perangkat jaringan utama", totalItems: 145 },
  { id: "kat-2", name: "Kabel & Konektor", description: "Infrastruktur fisik jaringan", totalItems: 2500 },
  { id: "kat-3", name: "Perangkat Akses", description: "Access point, modem, dll", totalItems: 80 },
  { id: "kat-4", name: "Aksesoris", description: "Rack, UPS, komponen pelengkap", totalItems: 45 },
];

export default function KategoriBarangPage() {
  const [categories, setCategories] = useState<Kategori[]>(MOCK_DATA);
  const [searchQuery, setSearchQuery] = useState("");

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const handleOpenSheet = (id?: string) => {
    if (id) {
      const cat = categories.find(c => c.id === id);
      if (cat) {
        setName(cat.name);
        setDescription(cat.description);
        setEditId(id);
      }
    } else {
      setName("");
      setDescription("");
      setEditId(null);
    }
    setIsSheetOpen(true);
  };

  const handleSave = () => {
    if (editId) {
      setCategories(categories.map(c => c.id === editId ? { ...c, name, description } : c));
    } else {
      const newCategory: Kategori = {
        id: `kat-${Date.now()}`,
        name: name || "Kategori Baru",
        description: description || "-",
        totalItems: 0
      };
      setCategories([...categories, newCategory]);
    }
    setIsSheetOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 text-neutral-100 max-w-[1400px] mx-auto w-full">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            type="search"
            placeholder="Cari kategori..."
            className="w-full pl-9 bg-neutral-900 border-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="w-full sm:w-auto gap-2" onClick={() => handleOpenSheet()}>
          <Plus className="w-4 h-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-10">
        {filteredCategories.map(cat => (
          <Card key={cat.id} className="border-neutral-800 bg-neutral-900/40 backdrop-blur-md overflow-hidden relative group transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/60">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-blue-500/10 rounded-xl shrink-0">
                  <Shapes className="w-6 h-6 text-blue-400" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800 text-neutral-200">
                    <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet(cat.id)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Kategori
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 focus:bg-red-950/50 focus:text-red-400 cursor-pointer" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Hapus Kategori
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <h3 className="font-semibold text-lg text-neutral-100 mb-1">{cat.name}</h3>
                <p className="text-sm text-neutral-500 line-clamp-2">{cat.description}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-800/60 flex justify-between items-center">
                <span className="text-xs font-medium text-neutral-500">Total Barang</span>
                <span className="text-sm font-medium text-neutral-300">{cat.totalItems} Unit</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCategories.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-medium text-neutral-300 mb-1">Kategori Tidak Ditemukan</h3>
            <p className="text-sm text-neutral-500 max-w-sm">Coba gunakan kata kunci lain atau tambahkan kategori baru.</p>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md border-neutral-800 bg-neutral-950 p-0 flex flex-col text-neutral-200">
          <SheetHeader className="p-6 border-b border-neutral-800/60 bg-neutral-900/20">
            <SheetTitle className="text-xl text-neutral-100">{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</SheetTitle>
            <SheetDescription className="text-neutral-400">
              Isi formulir di bawah ini untuk mengelola informasi kategori.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label>Nama Kategori</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Router & Switch" className="bg-neutral-900 border-neutral-800" />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Masukkan deskripsi..." className="bg-neutral-900 border-neutral-800" />
              </div>
            </div>
          </div>
          <SheetFooter className="p-6 border-t border-neutral-800/60 bg-neutral-900/20 flex sm:justify-end gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="hover:bg-neutral-800 text-neutral-300">Batal</Button>
            <Button onClick={handleSave}>Simpan Perubahan</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

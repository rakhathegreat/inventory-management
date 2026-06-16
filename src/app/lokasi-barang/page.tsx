"use client";

import React, { useState, useMemo } from "react";
import {
  Plus, Edit, Trash2, Power, Layers, Archive, MoreVertical,
  Search, Box, AlignJustify
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
type BrandRule = string;

type Level = {
  id: string;
  name: string;
  capacity: number;
  usedCapacity: number;
  brandRule: BrandRule;
  isActive: boolean;
};

type StorageLocation = {
  id: string;
  name: string;
  type: "Rak" | "Kardus";
  isActive: boolean;
  levels?: Level[];
  capacity?: number;
  usedCapacity?: number;
  brandRule?: BrandRule;
};

type SheetMode = "closed" | "add-rak" | "add-kardus" | "edit-rak" | "edit-kardus" | "add-level" | "edit-level";

const BRANDS = ["Campuran", "Samsung", "Apple", "Sony", "LG", "Xiaomi", "Asus"];

const MOCK_DATA: StorageLocation[] = [
  {
    id: "rak-1",
    name: "Rak A1 - Elektronik",
    type: "Rak",
    isActive: true,
    levels: [
      { id: "lvl-1", name: "Level 1", capacity: 100, usedCapacity: 45, brandRule: "Campuran", isActive: true },
      { id: "lvl-2", name: "Level 2", capacity: 50, usedCapacity: 50, brandRule: "Samsung", isActive: true },
      { id: "lvl-3", name: "Level 3", capacity: 50, usedCapacity: 0, brandRule: "Apple", isActive: false },
    ]
  },
  {
    id: "kar-1",
    name: "Kardus K-01",
    type: "Kardus",
    isActive: true,
    capacity: 20,
    usedCapacity: 5,
    brandRule: "Campuran"
  },
  {
    id: "rak-2",
    name: "Rak B2 - Aksesoris",
    type: "Rak",
    isActive: false,
    levels: [
      { id: "lvl-4", name: "Level 1", capacity: 200, usedCapacity: 120, brandRule: "Campuran", isActive: false },
    ]
  }
];

export default function LokasiBarangPage() {
  const [locations, setLocations] = useState<StorageLocation[]>(MOCK_DATA);
  const [sheetMode, setSheetMode] = useState<SheetMode>("closed");
  const [activeItem, setActiveItem] = useState<{ parentId?: string; levelId?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("rak");
  const [searchQuery, setSearchQuery] = useState("");

  // Form States
  const [locName, setLocName] = useState("");
  const [locCapacity, setLocCapacity] = useState("");
  const [locBrand, setLocBrand] = useState("Campuran");
  const [locLevelsCount, setLocLevelsCount] = useState("3");
  const [levelName, setLevelName] = useState("");

  const stats = useMemo(() => {
    let totalRak = 0;
    let totalKardus = 0;
    let maxCapacity = 0;
    let usedCapacity = 0;

    locations.forEach(loc => {
      if (loc.type === "Rak") {
        totalRak++;
        loc.levels?.forEach(lvl => {
          maxCapacity += lvl.capacity;
          usedCapacity += lvl.usedCapacity;
        });
      } else {
        totalKardus++;
        maxCapacity += loc.capacity || 0;
        usedCapacity += loc.usedCapacity || 0;
      }
    });

    return { totalRak, totalKardus, maxCapacity, usedCapacity };
  }, [locations]);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesTab = loc.type.toLowerCase() === activeTab;
      const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [locations, activeTab, searchQuery]);

  const resetForm = () => {
    setLocName("");
    setLocCapacity("");
    setLocBrand("Campuran");
    setLocLevelsCount("1");
    setLevelName("");
  };

  const handleOpenSheet = (mode: SheetMode, item?: { parentId?: string; levelId?: string }) => {
    setSheetMode(mode);
    setActiveItem(item || null);
    resetForm();

    if (item && item.parentId) {
      const loc = locations.find(l => l.id === item.parentId);
      if (loc) {
        if (mode === "edit-rak" || mode === "edit-kardus") {
          setLocName(loc.name);
          if (loc.type === "Kardus") {
            setLocCapacity(loc.capacity?.toString() || "");
            setLocBrand(loc.brandRule || "Campuran");
          }
        } else if (mode === "edit-level" && item.levelId) {
          const lvl = loc.levels?.find(l => l.id === item.levelId);
          if (lvl) {
            setLevelName(lvl.name);
            setLocCapacity(lvl.capacity.toString());
            setLocBrand(lvl.brandRule);
          }
        }
      }
    }
  };

  const handleSave = () => {
    if (sheetMode === "add-rak") {
      const newRak: StorageLocation = {
        id: `rak-${Date.now()}`,
        name: locName || "Rak Baru",
        type: "Rak",
        isActive: true,
        levels: Array.from({ length: parseInt(locLevelsCount) || 1 }).map((_, i) => ({
          id: `lvl-${Date.now()}-${i}`,
          name: `Level ${i + 1}`,
          capacity: 0,
          usedCapacity: 0,
          brandRule: "Campuran",
          isActive: true
        }))
      };
      setLocations([...locations, newRak]);
    } else if (sheetMode === "add-kardus") {
      const newKardus: StorageLocation = {
        id: `kar-${Date.now()}`,
        name: locName || "Kardus Baru",
        type: "Kardus",
        isActive: true,
        capacity: parseInt(locCapacity) || 0,
        usedCapacity: 0,
        brandRule: locBrand
      };
      setLocations([...locations, newKardus]);
    } else if (sheetMode === "edit-rak" && activeItem?.parentId) {
      setLocations(locations.map(l => l.id === activeItem.parentId ? { ...l, name: locName } : l));
    } else if (sheetMode === "edit-kardus" && activeItem?.parentId) {
      setLocations(locations.map(l => l.id === activeItem.parentId ? { ...l, name: locName, capacity: parseInt(locCapacity) || 0, brandRule: locBrand } : l));
    } else if (sheetMode === "add-level" && activeItem?.parentId) {
      const newLevel: Level = {
        id: `lvl-${Date.now()}`,
        name: levelName || "Level Baru",
        capacity: parseInt(locCapacity) || 0,
        usedCapacity: 0,
        brandRule: locBrand,
        isActive: true
      };
      setLocations(locations.map(l => l.id === activeItem.parentId ? { ...l, levels: [...(l.levels || []), newLevel] } : l));
    } else if (sheetMode === "edit-level" && activeItem?.parentId && activeItem?.levelId) {
      setLocations(locations.map(l => {
        if (l.id === activeItem.parentId) {
          return {
            ...l,
            levels: l.levels?.map(lvl => lvl.id === activeItem.levelId ? { ...lvl, name: levelName, capacity: parseInt(locCapacity) || 0, brandRule: locBrand } : lvl)
          };
        }
        return l;
      }));
    }
    setSheetMode("closed");
  };

  const handleToggleLocation = (id: string) => {
    setLocations(locations.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l));
  };

  const handleToggleLevel = (rakId: string, levelId: string) => {
    setLocations(locations.map(l => {
      if (l.id === rakId) {
        return {
          ...l,
          levels: l.levels?.map(lvl => lvl.id === levelId ? { ...lvl, isActive: !lvl.isActive } : lvl)
        };
      }
      return l;
    }));
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) {
      setLocations(locations.filter(l => l.id !== id));
    }
  };

  const handleDeleteLevel = (rakId: string, levelId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus level ini?")) {
      setLocations(locations.map(l => {
        if (l.id === rakId) {
          return { ...l, levels: l.levels?.filter(lvl => lvl.id !== levelId) };
        }
        return l;
      }));
    }
  };

  const renderForm = () => {
    if (sheetMode === "add-rak" || sheetMode === "edit-rak") {
      return (
        <>
          <div className="space-y-2">
            <Label>Nama Rak</Label>
            <Input value={locName} onChange={e => setLocName(e.target.value)} placeholder="Contoh: Rak A1" className="bg-neutral-900 border-neutral-800" />
          </div>
          {sheetMode === "add-rak" && (
            <div className="space-y-2">
              <Label>Jumlah Level Awal</Label>
              <Input type="number" min="1" value={locLevelsCount} onChange={e => setLocLevelsCount(e.target.value)} className="bg-neutral-900 border-neutral-800" />
            </div>
          )}
        </>
      );
    }

    if (sheetMode === "add-kardus" || sheetMode === "edit-kardus") {
      return (
        <>
          <div className="space-y-2">
            <Label>Nama Kardus</Label>
            <Input value={locName} onChange={e => setLocName(e.target.value)} placeholder="Contoh: Kardus K-01" className="bg-neutral-900 border-neutral-800" />
          </div>
          <div className="space-y-2">
            <Label>Kapasitas Maksimal</Label>
            <Input type="number" min="0" value={locCapacity} onChange={e => setLocCapacity(e.target.value)} placeholder="0" className="bg-neutral-900 border-neutral-800" />
          </div>
          <div className="space-y-2">
            <Label>Aturan Merek</Label>
            <Select value={locBrand} onValueChange={setLocBrand}>
              <SelectTrigger className="bg-neutral-900 border-neutral-800">
                <SelectValue placeholder="Pilih Aturan" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }

    if (sheetMode === "add-level" || sheetMode === "edit-level") {
      return (
        <>
          <div className="space-y-2">
            <Label>Nama Level</Label>
            <Input value={levelName} onChange={e => setLevelName(e.target.value)} placeholder="Contoh: Level 1" className="bg-neutral-900 border-neutral-800" />
          </div>
          <div className="space-y-2">
            <Label>Kapasitas Maksimal</Label>
            <Input type="number" min="0" value={locCapacity} onChange={e => setLocCapacity(e.target.value)} placeholder="0" className="bg-neutral-900 border-neutral-800" />
          </div>
          <div className="space-y-2">
            <Label>Aturan Merek</Label>
            <Select value={locBrand} onValueChange={setLocBrand}>
              <SelectTrigger className="bg-neutral-900 border-neutral-800">
                <SelectValue placeholder="Pilih Aturan" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      );
    }
    return null;
  };

  const sheetTitles = {
    "add-rak": "Tambah Rak Baru",
    "edit-rak": "Edit Rak",
    "add-kardus": "Tambah Kardus Baru",
    "edit-kardus": "Edit Kardus",
    "add-level": "Tambah Level Rak",
    "edit-level": "Edit Level Rak",
    "closed": ""
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 text-neutral-100 max-w-[1400px] mx-auto w-full">
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs md:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="p-3 bg-primary/10 rounded-lg ml-4">
              <Layers className="text-primary w-5 h-5" />
            </div>
            <div className="flex flex-col w-full">
              <CardHeader className="flex flex-col">
                <CardDescription>Total Rak</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.totalRak} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>
        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="p-3 bg-primary/10 rounded-lg ml-4">
              <Archive className="text-primary w-5 h-5" />
            </div>
            <div className="flex flex-col w-full">
              <CardHeader className="flex flex-col">
                <CardDescription>Total Kardus</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.totalKardus} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>
        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="p-3 bg-primary/10 rounded-lg ml-4">
              <Box className="text-primary w-5 h-5" />
            </div>
            <div className="flex flex-col w-full">
              <CardHeader className="flex flex-col">
                <CardDescription>Kapasitas Terpakai</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.usedCapacity} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>
        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="p-3 bg-primary/10 rounded-lg ml-4">
              <AlignJustify className="text-primary w-5 h-5" />
            </div>
            <div className="flex flex-col w-full">
              <CardHeader className="flex flex-col">
                <CardDescription>Total Kapasitas</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.maxCapacity} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue="rak" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-[300px]">
          <TabsList className="bg-neutral-900 border border-neutral-800 w-full grid grid-cols-2">
            <TabsTrigger value="rak">Rak</TabsTrigger>
            <TabsTrigger value="kardus">Kardus</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              type="search"
              placeholder="Cari lokasi..."
              className="w-full pl-9 bg-neutral-900 border-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" /> Tambah Lokasi
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-neutral-950 border-neutral-800 text-neutral-200">
              <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet("add-rak")}>
                <Layers className="w-4 h-4 mr-2" /> Tambah Rak
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet("add-kardus")}>
                <Archive className="w-4 h-4 mr-2" /> Tambah Kardus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 pb-10">
        {filteredLocations.map(loc => {
          if (loc.type === "Rak") {
            return (
              <Card key={loc.id} className={`border-neutral-800 bg-neutral-900/40 backdrop-blur-md overflow-hidden flex flex-col relative group transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/60 hover:shadow-xl hover:shadow-black/20 ${!loc.isActive ? 'opacity-50 grayscale' : ''}`}>
                <CardHeader className="pb-4 border-b border-neutral-800/50 bg-neutral-900/20">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Layers className="w-5 h-5 text-blue-400" />
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-tight text-neutral-100">{loc.name}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-2 text-xs font-medium">
                        <span className="text-neutral-400">{loc.levels?.length || 0} Level</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-neutral-800 data-[state=open]:bg-neutral-800 text-neutral-400">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800 text-neutral-200">
                          <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet("edit-rak", { parentId: loc.id })}>
                            <Edit className="w-4 h-4 mr-2" /> Edit Nama Rak
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet("add-level", { parentId: loc.id })}>
                            <Plus className="w-4 h-4 mr-2" /> Tambah Level
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleToggleLocation(loc.id)}>
                            <Power className="w-4 h-4 mr-2" /> {loc.isActive ? "Nonaktifkan Rak" : "Aktifkan Rak"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 focus:bg-red-950/50 focus:text-red-400 cursor-pointer" onClick={() => handleDeleteLocation(loc.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Rak
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col">
                  <div className="flex-1 overflow-y-auto max-h-[320px] p-4 space-y-3">
                    {loc.levels?.map(lvl => {
                      const isEffectiveActive = loc.isActive && lvl.isActive;
                      return (
                        <div key={lvl.id} className={`p-3 rounded-xl border transition-colors ${isEffectiveActive ? 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700' : 'border-neutral-800/50 bg-neutral-900/30 opacity-50 grayscale'} flex flex-col gap-3 group/level`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-neutral-200">{lvl.name}</span>
                            </div>
                            <div className="flex gap-1 items-end">
                              <span className="px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 truncate max-w-[120px] font-medium border border-neutral-700/50">{lvl.brandRule}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-70 group-hover/level:opacity-100 transition-opacity hover:bg-neutral-800 text-neutral-400">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800 text-neutral-200">
                                  <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet("edit-level", { parentId: loc.id, levelId: lvl.id })}>
                                    <Edit className="w-4 h-4 mr-2" /> Edit Level
                                  </DropdownMenuItem>
                                  <DropdownMenuItem disabled={!loc.isActive} className="cursor-pointer focus:bg-neutral-800" onClick={() => handleToggleLevel(loc.id, lvl.id)}>
                                    <Power className="w-4 h-4 mr-2" /> {lvl.isActive ? "Nonaktifkan Level" : "Aktifkan Level"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-400 focus:bg-red-950/50 focus:text-red-400 cursor-pointer" onClick={() => handleDeleteLevel(loc.id, lvl.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Hapus Level
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="text-neutral-500 font-medium">Kapasitas</span>
                              <span className="text-neutral-300 font-semibold">{lvl.usedCapacity} <span className="text-neutral-600 font-normal">/ {lvl.capacity}</span></span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-500 ${lvl.usedCapacity >= lvl.capacity ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : lvl.usedCapacity > lvl.capacity * 0.7 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}
                              style={{ width: `${lvl.capacity > 0 ? Math.min(100, (lvl.usedCapacity / lvl.capacity) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    {(!loc.levels || loc.levels.length === 0) && (
                      <div className="text-center p-6 border-2 border-dashed border-neutral-800/80 rounded-xl text-neutral-500 text-sm flex flex-col items-center justify-center gap-2">
                        <Box className="w-8 h-8 text-neutral-700 mb-1" />
                        <p>Rak ini belum memiliki level.</p>
                        <Button variant="link" className="text-blue-400 h-auto p-0" onClick={() => handleOpenSheet("add-level", { parentId: loc.id })}>
                          Tambah level sekarang
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          } else {
            return (
              <Card key={loc.id} className={`border-neutral-800 bg-neutral-900/40 backdrop-blur-md overflow-hidden flex flex-col relative group transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/60 hover:shadow-md hover:shadow-black/20 ${!loc.isActive ? 'opacity-50 grayscale' : ''}`}>
                <CardContent className="px-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
                        <Archive className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-base font-semibold tracking-tight text-neutral-100">{loc.name}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 truncate max-w-[120px] font-medium border border-neutral-700/50">{loc.brandRule}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-neutral-800 data-[state=open]:bg-neutral-800 text-neutral-400">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-950 border-neutral-800 text-neutral-200">
                          <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleOpenSheet("edit-kardus", { parentId: loc.id })}>
                            <Edit className="w-4 h-4 mr-2" /> Edit Kardus
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-800" />
                          <DropdownMenuItem className="cursor-pointer focus:bg-neutral-800" onClick={() => handleToggleLocation(loc.id)}>
                            <Power className="w-4 h-4 mr-2" /> {loc.isActive ? "Nonaktifkan Kardus" : "Aktifkan Kardus"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 focus:bg-red-950/50 focus:text-red-400 cursor-pointer" onClick={() => handleDeleteLocation(loc.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Kardus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-auto">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-medium">Kapasitas</span>
                      <span className="font-semibold text-neutral-300">{loc.usedCapacity} <span className="text-neutral-600 font-normal">/ {loc.capacity}</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full transition-all duration-500 ${(loc.usedCapacity || 0) >= (loc.capacity || 0) ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : (loc.usedCapacity || 0) > (loc.capacity || 0) * 0.7 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'}`}
                        style={{ width: `${(loc.capacity || 0) > 0 ? Math.min(100, ((loc.usedCapacity || 0) / (loc.capacity || 0)) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
        })}
        {filteredLocations.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-neutral-200">Lokasi Tidak Ditemukan</h3>
            <p className="text-neutral-500 max-w-md">Tidak ada lokasi penyimpanan yang sesuai dengan kriteria pencarian atau filter Anda.</p>
          </div>
        )}
      </div>

      <Sheet open={sheetMode !== "closed"} onOpenChange={(open) => !open && setSheetMode("closed")}>
        <SheetContent className="sm:max-w-md border-neutral-800 bg-neutral-950 p-0 flex flex-col text-neutral-200">
          <SheetHeader className="p-6 border-b border-neutral-800/60 bg-neutral-900/20">
            <SheetTitle className="text-xl text-neutral-100">{sheetTitles[sheetMode as keyof typeof sheetTitles]}</SheetTitle>
            <SheetDescription className="text-neutral-400">
              Isi formulir di bawah ini untuk mengelola detail lokasi penyimpanan Anda.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid gap-5">
              {renderForm()}
            </div>
          </div>
          <SheetFooter className="p-6 border-t border-neutral-800/60 bg-neutral-900/20 flex sm:justify-end gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setSheetMode("closed")} className="hover:bg-neutral-800 text-neutral-300">Batal</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 border-none">Simpan Perubahan</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

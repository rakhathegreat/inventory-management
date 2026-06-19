import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BadgeCheck, Boxes, PackagePlus, ScanLine, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BrandOption = string;
type BrandDefinition = {
  name: string;
  identifier: string;
};
type KategoriOption = string;
type LokasiOption = string;
type LocationDefinition = {
  name: LokasiOption;
  brandRule: BrandOption;
};

type InventoryItem = {
  id: string;
  serialNumber: string;
  kategori: string;
  merek: string;
  status: string;
  lokasiPenyimpanan: string;
  tanggalMasuk: string;
  tanggalKeluar?: string;
  operatorInput: string;
};

type BarangMasukItem = {
  id: number;
  nomor: string;
  merek: string;
  kategori: KategoriOption;
  lokasi: LokasiOption;
  status: "Valid" | "Invalid";
  existingItemId?: string;
};

type KodeBarangUpdate = string | ((current: string) => string);

const detectBrandFromCode = (code: string, brands: BrandDefinition[]): BrandOption => {
  if (!code) return "";
  const normalizedCode = code.trim().toUpperCase();
  const matchedByIdentifier = brands.find((brand) => {
    const normalizedIdentifier = brand.identifier.trim().toUpperCase();
    return normalizedIdentifier && normalizedCode.startsWith(normalizedIdentifier);
  });

  if (matchedByIdentifier) return matchedByIdentifier.name;

  const prefix = normalizedCode.substring(0, 3);
  const matchedByName = brands.find((brand) => brand.name.toUpperCase().startsWith(prefix));
  return matchedByName?.name || "";
};

const isTextInputTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
};

const normalizeKodeBarang = (code: string) => code.trim().toUpperCase();
const normalizeBrand = (brand: string) => brand.trim().toLocaleLowerCase("id-ID");

const getRecommendedLocation = (
  brand: BrandOption,
  locations: LocationDefinition[],
  availableCapacity: Record<string, number>
): LokasiOption => {
  const availableLocations = locations.filter(
    (location) => (availableCapacity[location.name] ?? 0) > 0
  );
  const normalizedBrand = normalizeBrand(brand);

  if (normalizedBrand) {
    const matchingLocation = availableLocations.find(
      (location) => normalizeBrand(location.brandRule) === normalizedBrand
    );
    if (matchingLocation) return matchingLocation.name;
  }

  const mixedLocation = availableLocations.find((location) => {
    const normalizedRule = normalizeBrand(location.brandRule);
    return !normalizedRule || normalizedRule === "campuran";
  });

  return mixedLocation?.name || availableLocations[0]?.name || "";
};

function EmptyScanTableState() {
  return (
    <div className="flex items-center justify-center px-6 py-12">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border bg-muted/40 text-muted-foreground">
          <PackagePlus className="size-7" strokeWidth={1.8} />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">Belum ada barang masuk</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Scan atau masukkan serial number dari form di sebelah kiri untuk menambahkan item ke sesi ini.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BarangMasukPage() {
  const [kodeBarang, setKodeBarang] = useState("");
  const [inputMode, setInputMode] = useState<"auto" | "manual">("auto");
  const [merekFallback, setMerekFallback] = useState<BrandOption>("");
  const [kategoriBarang, setKategoriBarang] = useState<KategoriOption>("");
  const [barangMasuk, setBarangMasuk] = useState<BarangMasukItem[]>([]);
  const [kuota, setKuota] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const kodeBarangRef = useRef("");
  const [dbBrands, setDbBrands] = useState<BrandDefinition[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbLocations, setDbLocations] = useState<LocationDefinition[]>([]);
  const [dbItems, setDbItems] = useState<InventoryItem[]>([]);

  // Fetch brands, categories, and locations from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const brands = await invoke<any[]>("get_brands");
        const brandDefinitions = brands.map((brand: any) => ({
          name: brand.name,
          identifier: brand.identifier || "",
        }));
        setDbBrands(brandDefinitions);

        const categories = await invoke<any[]>("get_categories");
        const categoryNames = categories.map((c: any) => c.name);
        setDbCategories(categoryNames);

        if (categoryNames.length > 0) {
          setKategoriBarang(categoryNames[0]);
        }

        const items = await invoke<InventoryItem[]>("get_items");
        setDbItems(items);

        const locationsData = await invoke<any[]>("get_locations");
        const locs: LocationDefinition[] = [];
        const newKuota: Record<string, number> = {};

        locationsData.forEach(loc => {
          if (loc.isActive === false) return;

          if (loc.type === "Rak" && loc.levels) {
            loc.levels.forEach((lvl: any) => {
              if (lvl.isActive === false) return;

              const name = `${loc.name} - ${lvl.name}`;
              locs.push({
                name,
                brandRule: lvl.brandRule || "Campuran",
              });
              newKuota[name] = Math.max(0, lvl.capacity - (lvl.usedCapacity || 0));
            });
          } else {
            locs.push({
              name: loc.name,
              brandRule: loc.brandRule || "Campuran",
            });
            newKuota[loc.name] = Math.max(
              0,
              (loc.capacity || 0) - (loc.usedCapacity || 0)
            );
          }
        });
        setDbLocations(locs);
        setKuota(newKuota);

      } catch (error) {
        console.error("Gagal mengambil data dari database:", error);
        toast.error("Gagal memuat data barang masuk.");
      }
    };
    fetchData();
  }, []);

  const detectedBrand = detectBrandFromCode(kodeBarang, dbBrands);
  const totalKuotaTersedia = Object.values(kuota).reduce((total, value) => total + value, 0);
  const validItems = barangMasuk.filter((item) => item.status === "Valid").length;

  const updateKodeBarang = useCallback((value: KodeBarangUpdate) => {
    setKodeBarang((current) => {
      const nextValue = typeof value === "function" ? value(current) : value;
      kodeBarangRef.current = nextValue;
      return nextValue;
    });
  }, []);

  const focusKodeBarangInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Auto-focus pada input ketika component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-detect merek berdasarkan awal input kode
  useEffect(() => {
    if (detectedBrand) {
      setMerekFallback(detectedBrand);
    } else {
      setMerekFallback("");
    }
  }, [detectedBrand]);

  const handleSubmit = useCallback((kodeOverride = kodeBarang) => {
    const trimmedKode = kodeOverride.trim();
    if (!trimmedKode) return;

    const isDuplicate = barangMasuk.some(
      (item) => normalizeKodeBarang(item.nomor) === normalizeKodeBarang(trimmedKode)
    );

    if (isDuplicate) {
      toast.error("Serial number sudah ada di sesi ini.", {
        description: trimmedKode,
      });
      updateKodeBarang("");
      focusKodeBarangInput();
      return;
    }

    const existingItem = dbItems.find(
      (item) => normalizeKodeBarang(item.serialNumber) === normalizeKodeBarang(trimmedKode)
    );

    if (existingItem && existingItem.status.trim().toLowerCase() !== "keluar") {
      toast.error("Serial number masih terdaftar sebagai barang aktif.", {
        description: `Status saat ini: ${existingItem.status}`,
      });
      updateKodeBarang("");
      focusKodeBarangInput();
      return;
    }

    const itemBrand =
      existingItem?.merek ||
      detectBrandFromCode(trimmedKode, dbBrands) ||
      merekFallback;
    const recommendedLocation = getRecommendedLocation(itemBrand, dbLocations, kuota);

    if (!recommendedLocation) {
      toast.error(
        dbLocations.length === 0
          ? "Tidak ada lokasi penyimpanan aktif yang tersedia."
          : "Semua lokasi penyimpanan sudah penuh."
      );
      focusKodeBarangInput();
      return;
    }

    const newItem: BarangMasukItem = {
      id: Date.now(),
      nomor: trimmedKode,
      merek: itemBrand || "(otomatis)",
      kategori: existingItem?.kategori || kategoriBarang,
      lokasi: recommendedLocation,
      status: "Valid",
      existingItemId: existingItem?.id,
    };

    // Add to local UI list
    setBarangMasuk((current) => [newItem, ...current]);
    // (reverted) no temporary DB registration - keep local UI state only
    // Kurangi kuota lokasi yang dipilih
    setKuota((current) => ({
      ...current,
      [recommendedLocation]: current[recommendedLocation] - 1,
    }));

    updateKodeBarang("");
    setMerekFallback("");

    // Auto-focus kembali ke input setelah submit
    focusKodeBarangInput();
  }, [
    barangMasuk,
    dbBrands,
    dbItems,
    dbLocations,
    focusKodeBarangInput,
    kategoriBarang,
    kodeBarang,
    kuota,
    merekFallback,
    updateKodeBarang,
  ]);

  // Arahkan input keyboard/scanner ke field Kode/SN walaupun fokus sedang di area lain.
  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
        return;
      }

      const isSupportedKey = event.key.length === 1 || event.key === "Backspace" || event.key === "Enter";
      if (!isSupportedKey || isTextInputTarget(event.target)) {
        return;
      }

      if (document.querySelector("[data-slot='select-content']")) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();

      if (event.key === "Enter") {
        handleSubmit(kodeBarangRef.current);
        return;
      }

      if (event.key === "Backspace") {
        updateKodeBarang((current) => current.slice(0, -1));
        return;
      }

      updateKodeBarang((current) => `${current}${event.key}`);
    };

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [handleSubmit, updateKodeBarang]);

  const handleDeleteItem = (id: number) => {
    const itemToDelete = barangMasuk.find((item) => item.id === id);
    if (itemToDelete) {
      // Tambah kembali kuota lokasi
      setKuota((current) => ({
        ...current,
        [itemToDelete.lokasi]: current[itemToDelete.lokasi] + 1,
      }));
    }
    setBarangMasuk((current) => current.filter((item) => item.id !== id));
  };

  const handleUpdateLokasi = (id: number, newLokasi: LokasiOption) => {
    const itemToUpdate = barangMasuk.find((item) => item.id === id);
    if (!itemToUpdate) return;

    const oldLokasi = itemToUpdate.lokasi;

    // Check if kuota lokasi baru tersedia
    if (newLokasi !== oldLokasi && kuota[newLokasi] <= 0) {
      toast.error("Kuota lokasi sudah penuh.", {
        description: newLokasi,
      });
      return;
    }

    // Update barang lokasi
    setBarangMasuk((current) =>
      current.map((item) =>
        item.id === id ? { ...item, lokasi: newLokasi } : item
      )
    );

    // Update kuota: kembalikan kuota lokasi lama, kurangi kuota lokasi baru
    if (newLokasi !== oldLokasi) {
      setKuota((current) => ({
        ...current,
        [oldLokasi]: current[oldLokasi] + 1,
        [newLokasi]: current[newLokasi] - 1,
      }));
    }
  };

  const handleValidateAll = async () => {
    try {
      const sessionDate = new Date().toISOString().slice(0, 10);
      const dateStr = sessionDate.replace(/-/g, "");

      const txs = await invoke<any[]>("get_transactions");
      const prefix = `IN-${dateStr}-`;
      let maxNum = 0;
      txs.forEach(t => {
        if (t.nomor && t.nomor.startsWith(prefix)) {
          const numStr = t.nomor.slice(prefix.length);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const sessionNomor = `${prefix}${(maxNum + 1).toString().padStart(4, '0')}`;

      for (const item of barangMasuk) {
        const existingItem = item.existingItemId
          ? dbItems.find((dbItem) => dbItem.id === item.existingItemId)
          : undefined;

        if (item.existingItemId && !existingItem) {
          throw new Error(`Data lama untuk serial number ${item.nomor} tidak ditemukan.`);
        }

        if (existingItem) {
          const updatedItem: InventoryItem = {
            ...existingItem,
            serialNumber: item.nomor,
            kategori: item.kategori,
            merek: item.merek,
            status: "Masuk",
            lokasiPenyimpanan: item.lokasi,
            tanggalMasuk: sessionDate,
            tanggalKeluar: undefined,
            operatorInput: "Sistem",
          };
          await invoke("update_item", { item: updatedItem });
        } else {
          const newItem = {
            id: `UNIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            serialNumber: item.nomor,
            kategori: item.kategori,
            merek: item.merek,
            status: "Masuk",
            lokasiPenyimpanan: item.lokasi,
            tanggalMasuk: sessionDate,
            operatorInput: "Sistem",
          };
          await invoke("add_item", { item: newItem });
        }

        const newTransaction = {
          id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tanggal: sessionDate,
          nomor: sessionNomor,
          kategori: "Masuk",
          status: "Selesai",
          sn: item.nomor,
          merek: item.merek,
          asal: "Keluar",
          tujuan: item.lokasi,
          operator: "Sistem"
        };
        await invoke("add_transaction", { transaction: newTransaction });
      }
      toast.success(`${barangMasuk.length} barang masuk berhasil disimpan.`);
      setBarangMasuk([]); // Clear local state after saving

      const items = await invoke<InventoryItem[]>("get_items");
      setDbItems(items);
    } catch (error) {
      console.error("Gagal menyimpan ke database:", error);
      toast.error("Gagal menyimpan barang masuk ke database.");
    }
  };

  return (
    <div className="@container/main flex h-full select-none flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <PackagePlus className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Sesi Scan</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {barangMasuk.length} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>

        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <ScanLine className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Merek Terdeteksi</CardDescription>
                <CardTitle className="truncate text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {merekFallback || "-"}
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>

        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <BadgeCheck className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Validasi</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {validItems} <span className="text-sm font-normal text-muted-foreground">Valid</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>

        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <Boxes className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Kuota Tersisa</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {totalKuotaTersedia} <span className="text-sm font-normal text-muted-foreground">Slot</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid h-full gap-4 px-4 lg:px-6 @5xl/main:grid-cols-[minmax(320px,380px)_1fr]">
        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(107svh-var(--header-height)-15rem)]">
          <Tabs
            value={inputMode}
            onValueChange={(value) => {
              setInputMode(value as "auto" | "manual");
              focusKodeBarangInput();
            }}
            className="flex flex-1 flex-col gap-4"
          >
            <CardHeader className="flex flex-col gap-4 pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">Auto</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4">
              <TabsContent value="auto" className="mt-0 flex flex-1 flex-col">
                <Input
                  ref={inputRef}
                  id="kode-barang-auto"
                  value={kodeBarang}
                  onChange={(event) => updateKodeBarang(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Masukkan kode barang atau serial number"
                  className="hidden"
                />
                <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ScanLine className="size-8 animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold text-foreground">
                      Silakan scan menggunakan scanner
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Sistem akan menangkap kode secara otomatis dan menambahkannya ke daftar barang masuk.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-0 flex flex-col gap-3">
                <Label htmlFor="kode-barang-manual">Kode / SN</Label>
                <Input
                  ref={inputRef}
                  id="kode-barang-manual"
                  value={kodeBarang}
                  onChange={(event) => updateKodeBarang(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Masukkan kode barang atau serial number"
                />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="merek-fallback">Merek fallback</Label>
                    <span className="text-xs text-muted-foreground">
                      {merekFallback && detectedBrand === merekFallback
                        ? "Terdeteksi otomatis"
                        : "Jika pola SN tidak dikenali"}
                    </span>
                  </div>
                  <Select
                    value={merekFallback}
                    onValueChange={(value) => {
                      setMerekFallback(value as BrandOption);
                      focusKodeBarangInput();
                    }}
                  >
                    <SelectTrigger id="merek-fallback" className="w-full">
                      <SelectValue placeholder="Pilih merek" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {dbBrands.map((brand) => (
                          <SelectItem key={brand.name} value={brand.name}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="kategori-barang">Kategori Barang</Label>
                  <Select
                    value={kategoriBarang}
                    onValueChange={(value) => {
                      setKategoriBarang(value as KategoriOption);
                      focusKodeBarangInput();
                    }}
                  >
                    <SelectTrigger id="kategori-barang" className="w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {dbCategories.map((kategori) => (
                          <SelectItem key={kategori} value={kategori}>
                            {kategori}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>

          {inputMode === "manual" ? (
            <CardFooter className="mt-auto justify-end gap-2">
              <Button className="w-full gap-2 sm:w-auto" size="lg" onClick={() => handleSubmit()}>
                <PackagePlus className="size-4" />
                Simpan barang masuk
              </Button>
            </CardFooter>
          ) : null}
        </Card>

        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(100svh-var(--header-height)-15rem)]">
          <CardHeader className="flex flex-col gap-3 border-b pb-4 @lg/card:flex-row @lg/card:items-center @lg/card:justify-between">
            <div className="space-y-1">
              <CardTitle>Daftar Barang Masuk</CardTitle>
            </div>
            <Badge variant="outline" className="w-fit">
              {barangMasuk.length} Item
            </Badge>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1 overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow>
                    <TableHead className="w-14">No</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Merek</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Rekomendasi Lokasi</TableHead>
                    <TableHead>Status Validasi</TableHead>
                    <TableHead className="w-16 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barangMasuk.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyScanTableState />
                      </TableCell>
                    </TableRow>
                  ) : (
                    barangMasuk.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono">{item.nomor}</TableCell>
                        <TableCell>{item.merek}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal px-2.5 py-0.5">
                            {item.kategori}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.lokasi}
                            onValueChange={(value) => {
                              const selectedLokasi = value as LokasiOption;
                              if (kuota[selectedLokasi] <= 0) {
                                toast.error("Kuota lokasi sudah penuh dan tidak dapat dipilih.", {
                                  description: selectedLokasi,
                                });
                                focusKodeBarangInput();
                                return;
                              }
                              handleUpdateLokasi(item.id, selectedLokasi);
                              focusKodeBarangInput();
                            }}
                          >
                            <SelectTrigger className="w-220px">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {dbLocations.map((lokasi) => {
                                  const isDisabled = kuota[lokasi.name] <= 0;
                                  return (
                                    <SelectItem
                                      key={lokasi.name}
                                      value={lokasi.name}
                                      disabled={isDisabled}
                                    >
                                      {lokasi.name}{isDisabled ? " (Kuota penuh)" : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal gap-1.5 px-2.5 py-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${item.existingItemId ? "bg-sky-500" : "bg-emerald-500"}`} />
                            {item.existingItemId ? "Masuk Kembali" : item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <X className="size-4" />
                            <span className="sr-only">Hapus item</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button
              className="w-full gap-2 sm:w-auto"
              size="lg"
              onClick={handleValidateAll}
              disabled={barangMasuk.length === 0}
            >
              Simpan Semua
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Archive, BadgeCheck, Boxes, PackageMinus, ScanLine, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type LokasiOption = string;

type InventoryItem = {
  id: string;
  serialNumber: string;
  kategori: string;
  merek: string;
  status: string;
  lokasiPenyimpanan: string;
  tanggalMasuk: string;
  tanggalKeluar?: string;
};

type BarangKeluarItem = {
  id: number;
  nomor: string;
  merek: string;
  kategori: string;
  lokasi: LokasiOption;
  status: "Valid" | "Invalid";
};

type KodeBarangUpdate = string | ((current: string) => string);

const isTextInputTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
};

const normalizeKodeBarang = (code: string) => code.trim().toUpperCase();
const normalizeStatus = (status: string) => status.trim().toLocaleLowerCase("id-ID");

function EmptyScanTableState() {
  return (
    <div className="flex items-center justify-center px-6 py-12">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border bg-muted/40 text-muted-foreground">
          <PackageMinus className="size-7" strokeWidth={1.8} />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-foreground">Belum ada barang keluar</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Scan atau masukkan serial number dari form di sebelah kiri untuk menambahkan item ke sesi keluar.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BarangKeluarPage() {
  const [kodeBarang, setKodeBarang] = useState("");
  const [inputMode, setInputMode] = useState<"auto" | "manual">("auto");
  const [barangKeluar, setBarangKeluar] = useState<BarangKeluarItem[]>([]);
  const [kuota, setKuota] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const kodeBarangRef = useRef("");
  const [dbItems, setDbItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchItemsAndLocations = async () => {
      try {
        const items = await invoke<InventoryItem[]>("get_items");
        setDbItems(items);

        const locationsData = await invoke<any[]>("get_locations");
        const newKuota: Record<string, number> = {};

        locationsData.forEach(loc => {
          if (loc.type === "Rak" && loc.levels) {
            loc.levels.forEach((lvl: any) => {
              const name = `${loc.name} - ${lvl.name}`;
              newKuota[name] = lvl.capacity - (lvl.usedCapacity || 0);
            });
          } else {
            newKuota[loc.name] = (loc.capacity || 0) - (loc.usedCapacity || 0);
          }
        });
        setKuota(newKuota);
      } catch (error) {
        console.error("Gagal mengambil data dari SQLite:", error);
        toast.error("Gagal memuat data barang keluar.");
      }
    };
    fetchItemsAndLocations();
  }, []);
  const totalKuotaTersedia = Object.values(kuota).reduce((total, value) => total + value, 0);
  const validItems = barangKeluar.filter((item) => item.status === "Valid").length;

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

  const handleSubmit = useCallback((kodeOverride = kodeBarang) => {
    const trimmedKode = kodeOverride.trim();
    if (!trimmedKode) return;

    const isDuplicate = barangKeluar.some(
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

    // Periksa apakah kode yang discan ada di data master (SQLite)
    const matchedItem = dbItems.find((d) =>
      d.serialNumber && String(d.serialNumber).toUpperCase() === trimmedKode.toUpperCase()
    );

    if (!matchedItem) {
      toast.error("Data serial number tidak ditemukan.", {
        description: trimmedKode,
      });
      updateKodeBarang("");
      focusKodeBarangInput();
      return;
    }

    if (normalizeStatus(matchedItem.status) === "keluar") {
      toast.error("Barang ini sudah berstatus Keluar dan tidak dapat dikeluarkan kembali.", {
        description: trimmedKode,
      });
      updateKodeBarang("");
      focusKodeBarangInput();
      return;
    }

    const originalLoc = matchedItem.lokasiPenyimpanan || "-";

    const newItem: BarangKeluarItem = {
      id: Date.now(),
      nomor: trimmedKode,
      merek: matchedItem.merek || "-",
      kategori: matchedItem.kategori || "-",
      lokasi: originalLoc as LokasiOption,
      status: "Valid",
    };

    setBarangKeluar((current) => [newItem, ...current]);
    // Tambah kuota lokasi karena barang keluar
    setKuota((current) => ({
      ...current,
      [originalLoc]: (current[originalLoc as LokasiOption] || 0) + 1,
    }));

    updateKodeBarang("");

    // Auto-focus kembali ke input setelah submit
    focusKodeBarangInput();
  }, [barangKeluar, focusKodeBarangInput, kodeBarang, kuota, dbItems, updateKodeBarang]);

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
    const itemToDelete = barangKeluar.find((item) => item.id === id);
    if (itemToDelete) {
      // Kurangi kembali kuota lokasi karena batal dikeluarkan
      setKuota((current) => ({
        ...current,
        [itemToDelete.lokasi]: (current[itemToDelete.lokasi] || 0) - 1,
      }));
    }
    setBarangKeluar((current) => current.filter((item) => item.id !== id));
  };

  const handleValidateAll = async () => {
    try {
      const sessionDate = new Date().toISOString().slice(0, 10);
      const dateStr = sessionDate.replace(/-/g, "");

      const txs = await invoke<any[]>("get_transactions");
      const prefix = `OUT-${dateStr}-`;
      let maxNum = 0;
      txs.forEach(t => {
        if (t.nomor && t.nomor.startsWith(prefix)) {
          const numStr = t.nomor.slice(prefix.length);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const sessionNomor = `${prefix}${(maxNum + 1).toString().padStart(4, '0')}`;
      const latestItems = await invoke<InventoryItem[]>("get_items");

      const invalidItem = barangKeluar.find((item) => {
        const latestItem = latestItems.find(
          (dbItem) =>
            normalizeKodeBarang(dbItem.serialNumber) === normalizeKodeBarang(item.nomor)
        );
        return !latestItem || normalizeStatus(latestItem.status) === "keluar";
      });

      if (invalidItem) {
        const latestItem = latestItems.find(
          (dbItem) =>
            normalizeKodeBarang(dbItem.serialNumber) === normalizeKodeBarang(invalidItem.nomor)
        );

        toast.error(
          latestItem
            ? "Barang yang sudah berstatus Keluar tidak dapat disimpan kembali."
            : "Data barang tidak lagi ditemukan di data master.",
          { description: invalidItem.nomor }
        );
        setDbItems(latestItems);
        return;
      }

      for (const item of barangKeluar) {
        const originalItem = latestItems.find(
          (dbItem) =>
            normalizeKodeBarang(dbItem.serialNumber) === normalizeKodeBarang(item.nomor)
        )!;
        const originalLoc = originalItem.lokasiPenyimpanan || "-";
        const updatedItem: InventoryItem = {
          ...originalItem,
          status: "Keluar",
          lokasiPenyimpanan: "Keluar",
          tanggalKeluar: sessionDate,
        };
        await invoke("update_item", { item: updatedItem });

        const newTransaction = {
          id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tanggal: sessionDate,
          nomor: sessionNomor,
          kategori: "Keluar",
          status: "Selesai",
          sn: item.nomor,
          merek: item.merek,
          asal: originalLoc,
          tujuan: "Keluar",
        };
        await invoke("add_transaction", { transaction: newTransaction });
      }
      toast.success(`${barangKeluar.length} barang keluar berhasil disimpan.`);
      setBarangKeluar([]); // Clear local state after saving

      // Refresh DB Items after update
      const items = await invoke<InventoryItem[]>("get_items");
      setDbItems(items);
    } catch (error) {
      console.error("Gagal menyimpan ke database:", error);
      toast.error("Gagal menyimpan barang keluar ke database.");
    }
  };

  return (
    <div className="@container/main flex h-full select-none flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <PackageMinus className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Sesi Keluar</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {barangKeluar.length} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>

        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <Archive className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Data Master</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {dbItems.length} <span className="text-sm font-normal text-muted-foreground">Item</span>
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
        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(100svh-var(--header-height)-15rem)]">
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
                      Sistem akan menangkap kode secara otomatis dan menambahkannya ke daftar barang keluar.
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
              </TabsContent>
            </CardContent>
          </Tabs>

          {inputMode === "manual" ? (
            <CardFooter className="mt-auto justify-end gap-2">
              <Button className="w-full gap-2 sm:w-auto" size="lg" onClick={() => handleSubmit()}>
                <PackageMinus className="size-4" />
                Simpan barang keluar
              </Button>
            </CardFooter>
          ) : null}
        </Card>

        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(100svh-var(--header-height)-15rem)]">
          <CardHeader className="flex flex-col gap-3 border-b pb-4 @lg/card:flex-row @lg/card:items-center @lg/card:justify-between">
            <div className="space-y-1">
              <CardTitle>Daftar Barang Keluar</CardTitle>
            </div>
            <Badge variant="outline" className="w-fit">
              {barangKeluar.length} Item
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
                    <TableHead>Asal Lokasi</TableHead>
                    <TableHead>Status Validasi</TableHead>
                    <TableHead className="w-16 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barangKeluar.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyScanTableState />
                      </TableCell>
                    </TableRow>
                  ) : (
                    barangKeluar.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono">{item.nomor}</TableCell>
                        <TableCell>{item.merek}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal px-2.5 py-0.5">
                            {item.kategori}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.lokasi}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal gap-1.5 px-2.5 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {item.status}
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
              disabled={barangKeluar.length === 0}
            >
              Simpan
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

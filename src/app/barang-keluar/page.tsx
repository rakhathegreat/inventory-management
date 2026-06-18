import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Archive, BadgeCheck, Boxes, PackageMinus, X } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const lokasiOptions = ["Kardus 01 (Huawei)", "Kardus 02 (Ransom)", "Kardus 03 (Fiberhome)", "Gudang Utama", "Rak A - Level 1", "Rak A - Level 2", "Rak B - Level 1", "Rak B - Level 2"] as const;

// Kuota default untuk setiap lokasi
const defaultKuota: Record<(typeof lokasiOptions)[number], number> = {
  "Rak A - Level 1": 3,
  "Rak A - Level 2": 50,
  "Rak B - Level 1": 50,
  "Rak B - Level 2": 50,
  "Kardus 01 (Huawei)": 50,
  "Kardus 02 (Ransom)": 50,
  "Kardus 03 (Fiberhome)": 50,
  "Gudang Utama": 100,
};

type LokasiOption = (typeof lokasiOptions)[number];

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
  const [barangKeluar, setBarangKeluar] = useState<BarangKeluarItem[]>([]);
  const [kuota, setKuota] = useState(defaultKuota);
  const inputRef = useRef<HTMLInputElement>(null);
  const kodeBarangRef = useRef("");
  const [dbItems, setDbItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await invoke("get_items");
        setDbItems(items as any[]);
      } catch (error) {
        console.error("Gagal mengambil data master dari SQLite:", error);
      }
    };
    fetchItems();
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
      alert(`Nomor SN "${trimmedKode}" sudah ada dalam daftar! Tidak bisa duplikat.`);
      updateKodeBarang("");
      focusKodeBarangInput();
      return;
    }

    // Periksa apakah kode yang discan ada di data master (SQLite)
    const matchedItem = dbItems.find((d) =>
      d.serialNumber && String(d.serialNumber).toUpperCase() === trimmedKode.toUpperCase()
    );

    if (!matchedItem) {
      alert(`Data dengan kode "${trimmedKode}" tidak ditemukan!`);
      updateKodeBarang("");
      focusKodeBarangInput();
      return;
    }

    const originalLoc = matchedItem.storage_location || matchedItem.lokasiPenyimpanan || "-";

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

      for (const item of barangKeluar) {
        let originalLoc = "-";
        const originalItem = dbItems.find(d => String(d.serialNumber).toUpperCase() === item.nomor.toUpperCase());
        if (originalItem) {
          originalLoc = originalItem.storage_location || originalItem.lokasiPenyimpanan || "-";
          const updatedItem = {
            ...originalItem,
            status: "Keluar",
            lokasiPenyimpanan: "Keluar",
            tanggalKeluar: sessionDate,
            operatorInput: "Sistem",
          };
          await invoke("update_item", { item: updatedItem });
        } else {
          const newItem = {
            id: `UNIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            serialNumber: item.nomor,
            kategori: item.kategori,
            merek: item.merek,
            status: "Keluar",
            lokasiPenyimpanan: "Keluar",
            tanggalMasuk: sessionDate,
            tanggalKeluar: sessionDate,
            operatorInput: "Sistem",
          };
          await invoke("add_item", { item: newItem });
        }

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
          operator: "Sistem"
        };
        await invoke("add_transaction", { transaction: newTransaction });
      }
      alert(`Validasi & Simpan ${barangKeluar.length} Barang Keluar - Berhasil!`);
      setBarangKeluar([]); // Clear local state after saving

      // Refresh DB Items after update
      const items = await invoke("get_items");
      setDbItems(items as any[]);
    } catch (error) {
      console.error("Gagal menyimpan ke database:", error);
      alert("Terjadi kesalahan saat menyimpan barang keluar ke database!");
    }
  };

  return (
    <div className="@container/main flex flex-col h-full gap-4 py-4 md:gap-6 md:py-6">
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
          <CardHeader className="flex flex-row items-start gap-3 pb-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageMinus className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Barang Keluar</CardTitle>
              <CardDescription>
                Pindai kode atau keluarkan SN, lalu pilih merek fallback bila perlu.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="kode-barang">Kode / SN</Label>
              <Input
                ref={inputRef}
                id="kode-barang"
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
            </div>
          </CardContent>

          <CardFooter className="mt-auto justify-end gap-2">
            <Button className="w-full gap-2 sm:w-auto" size="lg" onClick={() => handleSubmit()}>
              <PackageMinus className="size-4" />
              Simpan barang keluar
            </Button>
          </CardFooter>
        </Card>

        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(100svh-var(--header-height)-15rem)]">
          <CardHeader className="flex flex-col gap-3 border-b pb-4 @lg/card:flex-row @lg/card:items-center @lg/card:justify-between">
            <div className="space-y-1">
              <CardTitle>Daftar Sementara Sesi Scan</CardTitle>
              <CardDescription>
                {barangKeluar.length} item barang keluar sebelum diverifikasi dan disimpan permanen.
              </CardDescription>
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
              <BadgeCheck className="size-4" />
              Validasi & Simpan Semua
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

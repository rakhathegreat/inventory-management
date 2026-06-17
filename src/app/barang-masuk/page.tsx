import { useState, useEffect, useRef } from "react";
import { BadgeCheck, Boxes, PackagePlus, ScanLine, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const brandOptions = ["Ransom", "Fiberhome", "Huawei"] as const;
const kategoriOptions = ["Kabel Fiber", "ONT", "Splitter", "Adaptor", "PDU", "Lainnya"] as const;
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

type BrandOption = (typeof brandOptions)[number] | "";
type KategoriOption = (typeof kategoriOptions)[number];
type LokasiOption = (typeof lokasiOptions)[number];

// Mapping dari prefix kode ke merek
const brandPrefixMap: Record<string, BrandOption> = {
  FHT: "Ransom",
  ABC: "Fiberhome",
  HUA: "Huawei",
};

type BarangMasukItem = {
  id: number;
  nomor: string;
  merek: string;
  kategori: KategoriOption;
  lokasi: LokasiOption;
  status: "Valid" | "Invalid";
};

// Fungsi untuk mendeteksi merek dari awal input kode
const detectBrandFromCode = (code: string): BrandOption => {
  if (!code) return "";
  const prefix = code.substring(0, 3).toUpperCase();
  return brandPrefixMap[prefix] || "";
};

export default function BarangMasukPage() {
  const [kodeBarang, setKodeBarang] = useState("");
  const [merekFallback, setMerekFallback] = useState<BrandOption>("");
  const [kategoriBarang, setKategoriBarang] = useState<KategoriOption>("Kabel Fiber");
  const [barangMasuk, setBarangMasuk] = useState<BarangMasukItem[]>([]);
  const [kuota, setKuota] = useState(defaultKuota);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectedBrand = detectBrandFromCode(kodeBarang);
  const totalKuotaTersedia = Object.values(kuota).reduce((total, value) => total + value, 0);
  const validItems = barangMasuk.filter((item) => item.status === "Valid").length;

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

  const handleSubmit = () => {
    const trimmedKode = kodeBarang.trim();
    if (!trimmedKode) return;

    const defaultLokasi = lokasiOptions[0];

    // Check if kuota tersedia
    if (kuota[defaultLokasi] <= 0) {
      alert(`Kuota lokasi "${defaultLokasi}" sudah penuh!`);
      return;
    }

    const newItem: BarangMasukItem = {
      id: Date.now(),
      nomor: trimmedKode,
      merek: merekFallback || "(otomatis)",
      kategori: kategoriBarang,
      lokasi: defaultLokasi,
      status: "Valid",
    };

    // Add to local UI list
    setBarangMasuk((current) => [newItem, ...current]);
    // (reverted) no temporary DB registration - keep local UI state only
    // Kurangi kuota lokasi yang dipilih
    setKuota((current) => ({
      ...current,
      [defaultLokasi]: current[defaultLokasi] - 1,
    }));

    setKodeBarang("");
    setMerekFallback("");

    // Auto-focus kembali ke input setelah submit
    setTimeout(() => inputRef.current?.focus(), 0);
  };

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
      alert(`Kuota lokasi "${newLokasi}" sudah penuh!`);
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

  const handleValidateAll = () => {
    alert(`Validasi & Simpan ${barangMasuk.length} Barang Masuk - Berhasil!`);
  };

  return (
    <div className="@container/main flex flex-col h-full gap-4 py-4 md:gap-6 md:py-6">
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
                <CardAction className="absolute right-4 top-4">
                  <Badge variant="outline">Aktif</Badge>
                </CardAction>
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
                <CardAction className="absolute right-4 top-4">
                  <Badge variant="outline">{detectedBrand ? "Auto" : "Manual"}</Badge>
                </CardAction>
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
                <CardAction className="absolute right-4 top-4">
                  <Badge variant="outline">Siap</Badge>
                </CardAction>
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
                <CardAction className="absolute right-4 top-4">
                  <Badge variant="outline">Gudang</Badge>
                </CardAction>
              </CardHeader>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid h-full gap-4 px-4 lg:px-6 @5xl/main:grid-cols-[minmax(320px,380px)_1fr]">
        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(107svh-var(--header-height)-15rem)]">
          <CardHeader className="flex flex-row items-start gap-3 pb-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackagePlus className="size-5" />
            </div>
            <div className="space-y-1">
              <CardTitle>Barang Masuk</CardTitle>
              <CardDescription>
                Pindai kode atau masukkan SN, lalu pilih merek fallback bila perlu.
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
                onChange={(event) => setKodeBarang(event.target.value)}
                placeholder="Masukkan kode barang atau serial number"
              />
            </div>

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
                onValueChange={(value) => setMerekFallback(value as BrandOption)}
              >
                <SelectTrigger id="merek-fallback" className="w-full">
                  <SelectValue placeholder="Pilih merek" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {brandOptions.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
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
                onValueChange={(value) => setKategoriBarang(value as KategoriOption)}
              >
                <SelectTrigger id="kategori-barang" className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {kategoriOptions.map((kategori) => (
                      <SelectItem key={kategori} value={kategori}>
                        {kategori}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="mt-auto justify-end gap-2">
            <Button className="w-full gap-2 sm:w-auto" size="lg" onClick={handleSubmit}>
              <PackagePlus className="size-4" />
              Simpan barang masuk
            </Button>
          </CardFooter>
        </Card>

        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(100svh-var(--header-height)-15rem)]">
          <CardHeader className="flex flex-col gap-3 border-b pb-4 @lg/card:flex-row @lg/card:items-center @lg/card:justify-between">
            <div className="space-y-1">
              <CardTitle>Daftar Sementara Sesi Scan</CardTitle>
              <CardDescription>
                {barangMasuk.length} item barang masuk sebelum diverifikasi dan disimpan permanen.
              </CardDescription>
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
                      <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                        Belum ada barang masuk. Tambahkan item dari form scan di sebelah kiri.
                      </TableCell>
                    </TableRow>
                  ) : (
                    barangMasuk.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono">{item.nomor}</TableCell>
                        <TableCell>{item.merek}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="px-1.5 text-muted-foreground">
                            {item.kategori}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.lokasi}
                            onValueChange={(value) => {
                              const selectedLokasi = value as LokasiOption;
                              if (kuota[selectedLokasi] <= 0) {
                                alert(`Kuota lokasi "${selectedLokasi}" sudah penuh dan tidak dapat dipilih.`);
                                return;
                              }
                              handleUpdateLokasi(item.id, selectedLokasi);
                            }}
                          >
                            <SelectTrigger className="w-220px">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {lokasiOptions.map((lokasi) => {
                                  const isDisabled = kuota[lokasi] <= 0;
                                  return (
                                    <SelectItem key={lokasi} value={lokasi} disabled={isDisabled}>
                                      {lokasi}{isDisabled ? " (Kuota penuh)" : ""}
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
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
              disabled={barangMasuk.length === 0}
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

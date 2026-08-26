import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useInboundSession } from "./useInboundSession";
import { useBarcodeScanner } from "./useBarcodeScanner";
import { fetchBarangMasukMasterData, fetchInventoryItems, submitInboundSession } from "../api/barangMasukApi";
import { detectMitraFromSN } from "../utils/brandDetector";
import { loadIdentifiers, saveIdentifiers } from "../utils/identifierStore";
import { calculateCapacityMap } from "../utils/locationSmartRouting";
import {
  decideInboundScan,
  describeIntakeFailure,
} from "../utils/inboundDecision";
import type { BrandDefinition, LocationDefinition, InventoryItem } from "@/shared/types/inventory";
import type { Partner } from "@/shared/types/partner";

export function useBarangMasukLogic() {
  
  // Master data
  const [dbBrands, setDbBrands] = useState<BrandDefinition[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbModels, setDbModels] = useState<any[]>([]);
  const [dbLocations, setDbLocations] = useState<LocationDefinition[]>([]);
  const [, setDbItems] = useState<InventoryItem[]>([]);
  const [dbPartners, setDbPartners] = useState<Partner[]>([]);

  // Form state
  const [kodeBarang, setKodeBarang] = useState("");
  const [asalBarang, setAsalBarang] = useState<string>("SBU Regional Jawa Barat");
  const [asalBarangManual, setAsalBarangManual] = useState<boolean>(false);
  const [itemCondition, setItemCondition] = useState<"baru" | "dismantle" | "rusak">("baru");
  const [catatan, setCatatan] = useState<string>("");
  const [nomorPA, setNomorPA] = useState<string>("");
  const [ticket, setTicket] = useState<string>("");
  const [tipeBarang, setTipeBarang] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [kategori, setKategori] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const kodeBarangRef = useRef("");

  const session = useInboundSession();

  const updateKodeBarang = useCallback((value: string | ((current: string) => string)) => {
    const nextValue = typeof value === "function" ? value(kodeBarangRef.current) : value;
    kodeBarangRef.current = nextValue;
    setKodeBarang(nextValue);
  }, []);

  const focusKodeBarangInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const refreshItems = useCallback(async () => {
    const items = await fetchInventoryItems();
    setDbItems(items);
    return items;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchBarangMasukMasterData();
        setDbPartners(data.partners);
        setDbBrands(data.brands);
        setDbCategories(data.categories);
        setDbModels(data.models);
        setDbItems(data.items);
        
        const locationOwner = "KP Tasikmalaya";
        const { locs, newKuota } = calculateCapacityMap(data.locations, data.items, locationOwner);
        setDbLocations(locs);
        session.setKuota(newKuota);

        // Seluruh identifier merek disimpan ke storage — dipakai gerbang scan.
        saveIdentifiers(data.brands);
      } catch (error) {
        toast.error("Gagal memuat data material masuk.");
      }
    };
    void fetchData();
  }, [session.setKuota]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshItems();
      }
    };
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshItems]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (asalBarangManual) return;
    const detectedMitra = detectMitraFromSN(kodeBarang, dbPartners);
    if (detectedMitra) {
      setAsalBarang(detectedMitra);
    } else {
      setAsalBarang("SBU Regional Jawa Barat");
    }
  }, [kodeBarang, dbPartners, asalBarangManual]);

  const handleSubmit = useCallback(async (kodeOverride = kodeBarang) => {
    const trimmedKode = kodeOverride.trim();
    if (!trimmedKode) return;

    // Kosongkan buffer/input seketika agar scan cepat berikutnya tidak menumpuk ke SN ini
    updateKodeBarang("");

    const latestItems = await refreshItems();

    const decision = decideInboundScan({
      kode: trimmedKode,
      kondisi: itemCondition,
      tipeBarang,
      brand,
      nomorPA,
      ticket,
      catatan,
      asalBarang,
      idSeed: Date.now(),
      allowedIdentifiers: loadIdentifiers().map((e) => e.identifier),
      sessionItems: session.barangMasuk,
      latestItems,
      dbBrands,
      dbModels,
      dbLocations,
      kuota: session.kuota,
    });

    if (decision.action === "reject") {
      toast.error(decision.message, { description: decision.description });
      focusKodeBarangInput();
      return;
    }

    session.addItem(decision.item);
    session.setKuota((current) => ({
      ...current,
      [decision.item.lokasi]: current[decision.item.lokasi] - 1,
    }));

    // Asal material yang dipilih manual TIDAK direset — berlaku untuk
    // semua scan berikutnya sampai user mengembalikannya ke otomatis.
    focusKodeBarangInput();
  }, [
    session,
    dbBrands,
    dbLocations,
    dbModels,
    refreshItems,
    focusKodeBarangInput,
    kodeBarang,
    updateKodeBarang,
    asalBarang,
    itemCondition,
    catatan,
    nomorPA,
    ticket,
    tipeBarang,
    brand
  ]);

  useBarcodeScanner({
    inputRef,
    kodeBarangRef,
    updateKodeBarang,
    onSubmit: handleSubmit,
  });

  const handleValidateAll = async () => {
    if (isSaving) return;

    const hasIncompleteNewItems = session.barangMasuk.some(
      (item) => item.kondisi === "Baru" && !item.tipe
    );
    if (hasIncompleteNewItems) {
      toast.error("Masih ada material Baru yang belum memiliki Model Material.", {
        description: "Silakan lengkapi Model Material di tabel sebelum menyimpan.",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Satu panggilan bulk — server yang memegang otoritas: nomor transaksi,
      // kapasitas, gating mitra, dan ledger. Per-item atomic.
      const { results } = await submitInboundSession(session.barangMasuk);
      const failed = results.filter((r) => !r.ok);
      const succeededNomors = results
        .filter((r) => r.ok)
        .map((r) => session.barangMasuk[r.index]?.nomor)
        .filter((n): n is string => Boolean(n));

      failed.forEach((f) => {
        const sn = session.barangMasuk[f.index]?.nomor ?? `item #${f.index}`;
        toast.error(describeIntakeFailure(f.reason), { description: sn });
      });

      if (failed.length > 0) {
        // Item berhasil dibuang dari sesi; item gagal tetap untuk diperbaiki lalu submit ulang.
        session.removeSucceeded(succeededNomors);
        await refreshItems();
        return;
      }

      toast.success(`${session.barangMasuk.length} barang masuk berhasil disimpan.`);
      session.clearSession();
      await refreshItems();
    } catch (error) {
      console.error("Gagal menyimpan ke database:", error);
      toast.error("Gagal menyimpan material masuk ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    session,
    dbBrands,
    dbCategories,
    dbModels,
    dbLocations,
    dbPartners,
    kodeBarang,
    updateKodeBarang,
    asalBarang,
    setAsalBarang,
    asalBarangManual,
    setAsalBarangManual,
    itemCondition,
    setItemCondition,
    nomorPA,
    setNomorPA,
    ticket,
    setTicket,
    tipeBarang,
    setTipeBarang,
    brand,
    setBrand,
    kategori,
    setKategori,
    catatan,
    setCatatan,
    isSaving,
    inputRef,
    kodeBarangRef,
    handleSubmit,
    handleValidateAll,
    focusKodeBarangInput,
  };
}

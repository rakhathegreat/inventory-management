import type { BarangMasukItem } from "@/modules/transaksi/types";
import type { BrandDefinition, InventoryItem, LocationDefinition } from "@/shared/types/inventory";
import { detectBrandFromCode } from "./brandDetector";
import { getRecommendedLocation } from "./locationSmartRouting";
import {
  normalizeKodeBarang,
  normalizeStatus,
  normalizeOwner,
} from "./validators";

/**
 * Keputusan scan barang masuk — PURE (tanpa IO/toast/state).
 * Dipisahkan dari useBarangMasukLogic agar bisa di-unit-test tanpa network.
 * Saran di client; penegakan akhir ada di server (POST /intake).
 */

export type InboundCondition = "baru" | "dismantle" | "rusak";

export interface InboundScanContext {
  kode: string;
  kondisi: InboundCondition;
  tipeBarang: string;
  brand: string;
  nomorPA: string;
  ticket: string;
  catatan: string;
  asalBarang: string;
  idSeed: number;

  sessionItems: BarangMasukItem[];
  latestItems: InventoryItem[];
  userRole?: string;
  userDisplayName?: string;

  dbBrands: BrandDefinition[];
  dbModels: any[];
  dbLocations: LocationDefinition[];
  kuota: Record<string, number>;
}

export type ScanDecision =
  | { action: "reject"; message: string; description?: string }
  | { action: "accept"; item: BarangMasukItem };

export function decideInboundScan(ctx: InboundScanContext): ScanDecision {
  const trimmedKode = ctx.kode.trim();

  if (!trimmedKode) {
    return { action: "reject", message: "Serial number kosong." };
  }

  const isDuplicate = ctx.sessionItems.some(
    (item) => normalizeKodeBarang(item.nomor) === normalizeKodeBarang(trimmedKode)
  );
  if (isDuplicate) {
    return { action: "reject", message: "Serial number sudah ada di sesi ini.", description: trimmedKode };
  }

  const existingItem = ctx.latestItems.find(
    (item) => normalizeKodeBarang(item.serialNumber) === normalizeKodeBarang(trimmedKode)
  );

  if (!existingItem && !ctx.tipeBarang) {
    return {
      action: "reject",
      message: "Model wajib dipilih.",
      description: "SN ini belum terdaftar di database. Pilih Model terlebih dahulu.",
    };
  }

  if (ctx.kondisi === "baru" && existingItem) {
    return {
      action: "reject",
      message: "Material sudah ada di database.",
      description: "SN ini sudah terdaftar. Silakan ubah kondisi ke 'dismantle' atau 'rusak'.",
    };
  }
  if (ctx.kondisi === "dismantle" && ctx.nomorPA.trim() === "") {
    return {
      action: "reject",
      message: "Nomor PA wajib diisi untuk material dismantle.",
      description: "Isi nomor PA sebelum scan material.",
    };
  }
  if (ctx.kondisi === "rusak") {
    if (ctx.ticket.trim() === "") {
      return {
        action: "reject",
        message: "Ticket wajib diisi untuk material rusak.",
        description: "Isi nomor ticket sebelum scan material.",
      };
    }
    if (ctx.catatan.trim() === "") {
      return {
        action: "reject",
        message: "Catatan wajib diisi untuk material rusak.",
        description: "Isi deskripsi kerusakan sebelum scan material.",
      };
    }
  }

  const selectedModelInfo =
    !existingItem && ctx.tipeBarang
      ? ctx.dbModels.find((m) => m.nama === ctx.tipeBarang)
      : null;

  const itemBrand =
    existingItem?.merek ||
    ctx.brand ||
    (selectedModelInfo?.brand?.nama || selectedModelInfo?.brand?.name) ||
    detectBrandFromCode(trimmedKode, ctx.dbBrands) ||
    "";

  let recommendedLocation = getRecommendedLocation(itemBrand, ctx.dbLocations, ctx.kuota);

  if (
    existingItem &&
    normalizeStatus(existingItem.status) !== "keluar" &&
    normalizeStatus(existingItem.status) !== "diluar" &&
    normalizeStatus(existingItem.status) !== "terdistribusi"
  ) {
    if (
      recommendedLocation &&
      recommendedLocation.trim().toLowerCase() === (existingItem.lokasiPenyimpanan || "").trim().toLowerCase()
    ) {
      const alternativeLocation = ctx.dbLocations.find(
        (loc) =>
          (ctx.kuota[loc.name] ?? 0) > 0 &&
          loc.name.trim().toLowerCase() !== (existingItem.lokasiPenyimpanan || "").trim().toLowerCase()
      );
      if (alternativeLocation) {
        recommendedLocation = alternativeLocation.name;
      } else {
        return {
          action: "reject",
          message:
            "Material sudah berada di lokasi tersebut dan tidak dapat dimasukkan kembali kecuali pindah penyimpanan.",
          description: `Lokasi saat ini: ${existingItem.lokasiPenyimpanan}`,
        };
      }
    }
  }

  if (!recommendedLocation) {
    return {
      action: "reject",
      message:
        ctx.dbLocations.length === 0
          ? "Tidak ada lokasi penyimpanan aktif yang tersedia."
          : "Semua lokasi penyimpanan sudah penuh.",
    };
  }

  const isRusak = ctx.kondisi === "rusak";
  const isExistingCondition = ctx.kondisi === "dismantle" || ctx.kondisi === "rusak";

  const item: BarangMasukItem = {
    id: ctx.idSeed,
    nomor: trimmedKode,
    merek: isExistingCondition ? existingItem?.merek || itemBrand || "" : itemBrand || "",
    kategori: isExistingCondition
      ? existingItem?.kategori || "ONT"
      : selectedModelInfo?.materialCategory?.nama || existingItem?.kategori || "ONT",
    tipe: isExistingCondition
      ? existingItem?.tipe || ctx.tipeBarang || ""
      : ctx.kondisi === "baru"
        ? ctx.tipeBarang
        : "",
    lokasi: recommendedLocation,
    status: isRusak ? "Rusak" : "Valid",
    existingItemId: existingItem?.id,
    source:
      !existingItem ||
      normalizeOwner(existingItem.mitra) === normalizeOwner("KP Tasikmalaya")
        ? "KP"
        : "Mitra",
    asal: ctx.asalBarang,
    kondisi: isRusak ? "Rusak" : "Bagus",
    catatan: isRusak ? ctx.catatan : undefined,
    nomorPA: ctx.kondisi === "dismantle" ? ctx.nomorPA.trim() : undefined,
    ticket: isRusak ? ctx.ticket.trim() : undefined,
  };

  return { action: "accept", item };
}

/** Payload satu item untuk POST /intake (server-authoritative). */
export function toIntakePayload(item: BarangMasukItem, todayISO: string) {
  return {
    serialNumber: item.nomor,
    kategori: item.kategori,
    merek: item.merek,
    tipe: item.tipe || undefined,
    kondisi: item.status === "Rusak" ? "Rusak" : item.nomorPA ? "Dismantle" : "Baru",
    paNumber: item.nomorPA || undefined,
    ticket: item.ticket || undefined,
    catatan: item.catatan || undefined,
    lokasiPenyimpanan: item.lokasi,
    asal: item.asal,
    tanggalMasuk: todayISO,
  };
}

const REASON_MESSAGES: Record<string, string> = {
  MISSING_SERIAL: "Serial number kosong.",
  DUPLICATE_SN_IN_BATCH: "Serial number duplikat dalam sesi pengiriman.",
  SN_REGISTERED: "Serial number sudah terdaftar — gunakan kondisi Dismantle atau Rusak.",
  INVALID_SN_FOR_DISMANTLE: "SN tidak ditemukan — daftarkan sebagai material Baru terlebih dahulu.",
  MODEL_REQUIRED_FOR_BARU: "Model wajib dipilih untuk material Baru.",
  PA_REQUIRED_FOR_DISMANTLE: "Nomor PA wajib untuk material Dismantle.",
  TICKET_REQUIRED_FOR_RUSAK: "Ticket wajib untuk material Rusak.",
  CATEGORY_REQUIRED: "Kategori wajib diisi.",
  BRAND_REQUIRED: "Merek wajib diisi.",
  INVALID_MITRA_SOURCE: "Material belum bisa diterima — harus sudah keluar dari KP.",
  INVALID_CONDITION: "Kondisi material tidak valid.",
  CAPACITY_FULL: "Kapasitas lokasi penyimpanan penuh.",
};

/** Pesan Indonesia untuk kode penolakan bertipe dari POST /intake. */
export function describeIntakeFailure(reason?: string): string {
  if (!reason) return "Gagal disimpan oleh server.";
  return REASON_MESSAGES[reason] ?? `Gagal disimpan oleh server (${reason}).`;
}

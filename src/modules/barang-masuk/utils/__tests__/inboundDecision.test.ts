import { describe, it, expect } from "vitest";
import {
  decideInboundScan,
  toIntakePayload,
  describeIntakeFailure,
  type InboundScanContext,
} from "../inboundDecision";
import type { InventoryItem, LocationDefinition, BrandDefinition } from "@/shared/types/inventory";
import type { BarangMasukItem } from "@/modules/transaksi/types";

const brands = [{ name: "ZTE", identifier: "ZTE" }] as BrandDefinition[];

const locations = [
  { id: "1", name: "Rak A - L1", brandRule: "zte", isActive: true },
  { id: "2", name: "Rak B - L1", brandRule: "", isActive: true },
] as unknown as LocationDefinition[];

const baseCtx = (): InboundScanContext => ({
  kode: "SN-001",
  kondisi: "baru",
  tipeBarang: "F609",
  brand: "",
  nomorPA: "",
  ticket: "",
  catatan: "",
  asalBarang: "KP Tasikmalaya",
  idSeed: 42,
  sessionItems: [],
  latestItems: [],
  dbBrands: brands,
  dbModels: [
    { nama: "F609", brand: { nama: "ZTE" }, materialCategory: { nama: "ONT" } },
  ],
  dbLocations: locations,
  kuota: { "Rak A - L1": 5, "Rak B - L1": 5 },
});

describe("decideInboundScan", () => {
  it("gerbang identifier: SN di luar semua identifier ditolak", () => {
    const d = decideInboundScan({
      ...baseCtx(),
      kode: "HW-777",
      allowedIdentifiers: ["ZTE"],
    });
    expect(d.action).toBe("reject");
    if (d.action === "reject") expect(d.message).toBe("SN tidak dikenal sistem.");
  });

  it("gerbang identifier: SN cocok salah satu identifier diterima", () => {
    const d = decideInboundScan({
      ...baseCtx(),
      kode: "ZTE-001",
      allowedIdentifiers: ["HW", "ZTE"],
    });
    expect(d.action).toBe("accept");
  });

  it("daftar identifier kosong: gerbang nonaktif, SN apa pun lewat", () => {
    const d = decideInboundScan({
      ...baseCtx(),
      kode: "HW-777",
      allowedIdentifiers: [],
    });
    expect(d.action).not.toBe("reject");
  });

  it("accept scan Baru baru: kategori/model dari master data, lokasi disarankan", () => {
    const d = decideInboundScan(baseCtx());
    expect(d.action).toBe("accept");
    if (d.action !== "accept") return;
    expect(d.item.nomor).toBe("SN-001");
    expect(d.item.tipe).toBe("F609");
    expect(d.item.kondisi).toBe("Bagus");
    expect(d.item.status).toBe("Valid");
    expect(d.item.lokasi).toBeTruthy();
  });

  it("reject SN duplikat dalam sesi", () => {
    const ctx = baseCtx();
    ctx.sessionItems = [{ ...(ctx.sessionItems[0] as BarangMasukItem), nomor: "sn-001" }] as BarangMasukItem[];
    const d = decideInboundScan(ctx);
    expect(d.action).toBe("reject");
    if (d.action === "reject") expect(d.message).toContain("sesi ini");
  });

  it("Baru pada SN terdaftar → reject", () => {
    const ctx = baseCtx();
    ctx.latestItems = [
      { id: "x1", serialNumber: "SN-001", status: "Tersedia", lokasiPenyimpanan: "Rak B - L1" } as InventoryItem,
    ];
    const d = decideInboundScan(ctx);
    expect(d.action).toBe("reject");
    if (d.action === "reject") expect(d.message).toContain("sudah ada di database");
  });

  it("Dismantle tanpa Nomor PA → reject", () => {
    const ctx = baseCtx();
    ctx.kondisi = "dismantle";
    ctx.latestItems = [
      { id: "x1", serialNumber: "SN-001", status: "Terdistribusi", merek: "ZTE", kategori: "ONT", tipe: "F609", lokasiPenyimpanan: "Mitra" } as InventoryItem,
    ];
    const d = decideInboundScan(ctx);
    expect(d.action).toBe("reject");
    if (d.action === "reject") expect(d.message).toContain("Nomor PA");
  });

  it("Rusak tanpa ticket/catatan → reject", () => {
    const ctx = baseCtx();
    ctx.kondisi = "rusak";
    const d = decideInboundScan(ctx);
    expect(d.action).toBe("reject");
    if (d.action === "reject") expect(d.message).toContain("Ticket");
  });

  it("admin: item masih Tersedia + saran lokasi sama → pindah ke alternatif", () => {
    const ctx = baseCtx();
    ctx.kondisi = "dismantle";
    ctx.nomorPA = "PA-9";
    ctx.latestItems = [
      {
        id: "x1",
        serialNumber: "SN-001",
        status: "Tersedia",
        merek: "Lain",
        kategori: "ONT",
        tipe: "X1",
        lokasiPenyimpanan: "Rak B - L1",
      } as InventoryItem,
    ];
    // paksa saran jatuh ke Rak B - L1 (lokasi existing) dengan kuota Rak A nol
    ctx.kuota = { "Rak A - L1": 0, "Rak B - L1": 3 };
    const d = decideInboundScan(ctx);
    // Tidak ada alternatif berkuota → reject
    expect(d.action).toBe("reject");
  });
});

describe("toIntakePayload", () => {
  const item = (over: Partial<BarangMasukItem>): BarangMasukItem =>
    ({
      id: 1,
      nomor: "SN-9",
      merek: "ZTE",
      kategori: "ONT",
      tipe: "F609",
      lokasi: "Rak A - L1",
      status: "Valid",
      source: "Baru",
      asal: "KP Tasikmalaya",
      kondisi: "Bagus",
      ...over,
    }) as BarangMasukItem;

  it("item Valid tanpa nomorPA → kondisi Baru", () => {
    const p = toIntakePayload(item({}), "2026-08-24");
    expect(p.kondisi).toBe("Baru");
    expect(p.serialNumber).toBe("SN-9");
    expect(p.lokasiPenyimpanan).toBe("Rak A - L1");
    expect(p.tanggalMasuk).toBe("2026-08-24");
  });

  it("nomorPA terisi → kondisi Dismantle", () => {
    const p = toIntakePayload(item({ nomorPA: "PA-1" }), "2026-08-24");
    expect(p.kondisi).toBe("Dismantle");
    expect(p.paNumber).toBe("PA-1");
  });

  it("status Rusak → kondisi Rusak + ticket", () => {
    const p = toIntakePayload(item({ status: "Rusak", kondisi: "Rusak", ticket: "TKT-7" }), "2026-08-24");
    expect(p.kondisi).toBe("Rusak");
    expect(p.ticket).toBe("TKT-7");
  });
});

describe("describeIntakeFailure", () => {
  it("kode dikenal → pesan Indonesia", () => {
    expect(describeIntakeFailure("CAPACITY_FULL")).toContain("Kapasitas");
    expect(describeIntakeFailure("INVALID_MITRA_SOURCE")).toContain("keluar dari KP");
  });

  it("kode asing / kosong → fallback", () => {
    expect(describeIntakeFailure("WHATEVER")).toContain("WHATEVER");
    expect(describeIntakeFailure(undefined)).toContain("server");
  });
});

import { describe, it, expect } from "vitest";
import type { InventoryItem } from "@/shared/types/inventory";
import {
	computeOutboundKuota,
	findOlderFifoItem,
	isOutsideStatus,
} from "../outbound";

const item = (over: Partial<InventoryItem>): InventoryItem =>
	({
		id: over.serialNumber || "x",
		serialNumber: "SN-1",
		kategori: "ONT",
		merek: "ZTE",
		status: "tersedia",
		lokasiPenyimpanan: "Rak 1 - L1",
		tanggalMasuk: "2026-08-01",
		...over,
	}) as InventoryItem;

describe("isOutsideStatus", () => {
	it("keluar/diluar/terdistribusi = di luar", () => {
		expect(isOutsideStatus("Keluar")).toBe(true);
		expect(isOutsideStatus("terdistribusi")).toBe(true);
		expect(isOutsideStatus("Tersedia")).toBe(false);
	});
});

describe("findOlderFifoItem — aturan FIFO per grup merek+kategori+owner", () => {
	const older = item({
		serialNumber: "SN-LAMA",
		tanggalMasuk: "2026-07-01",
	});
	const newer = item({ serialNumber: "SN-BARU", tanggalMasuk: "2026-08-10" });

	it("menemukan SN lebih tua satu grup", () => {
		const found = findOlderFifoItem([older, newer], newer, new Set());
		expect(found?.serialNumber).toBe("SN-LAMA");
	});

	it("abaikan grup berbeda (merek beda)", () => {
		const otherGroup = item({ serialNumber: "SN-LAMA", tanggalMasuk: "2026-07-01", merek: "Huawei" });
		expect(findOlderFifoItem([otherGroup, newer], newer, new Set())).toBeUndefined();
	});

	it("abaikan SN yang sudah ada di antrean sesi", () => {
		expect(
			findOlderFifoItem([older, newer], newer, new Set(["SN-LAMA"])),
		).toBeUndefined();
	});

	it("abaikan item yang statusnya sudah di luar", () => {
		const goneOlder = item({ serialNumber: "SN-LAMA", tanggalMasuk: "2026-07-01", status: "Keluar" });
		expect(findOlderFifoItem([goneOlder, newer], newer, new Set())).toBeUndefined();
	});
});

describe("computeOutboundKuota", () => {
	const locations = [
		{ name: "Rak 1", type: "Rak", owner: "KP Tasikmalaya", levels: [
			{ name: "L1", capacity: 5 },
		] },
		{ name: "K-9", type: "Kardus", owner: "KP Tasikmalaya", capacity: 3 },
		{ name: "Keluar", type: "BOX", capacity: 100 },
	];
	const items = [
		item({ serialNumber: "A", lokasiPenyimpanan: "Rak 1 - L1" }),
		item({ serialNumber: "B", lokasiPenyimpanan: "Rak 1 - L1", status: "Keluar" }),
	];

	it("kuota = kapasitas − item aktif; keluar di-skip; keluar-status tak dihitung", () => {
		const kuota = computeOutboundKuota(locations, items, "KP Tasikmalaya");
		expect(kuota["Rak 1 - L1"]).toBe(4); // 5 − 1 aktif (item B keluar tak dihitung)
		expect(kuota["K-9"]).toBe(3);
		expect(kuota["Keluar"]).toBeUndefined();
	});

	it("lokasi milik owner lain diabaikan", () => {
		const kuota = computeOutboundKuota(locations, items, "PT Lain");
		expect(Object.keys(kuota)).toHaveLength(0);
	});
});

import { describe, it, expect } from "vitest";
import type { StorageLocation } from "@/shared/types/inventory";
import {
	isKpStorageLocation,
	usagePct,
	computeStats,
	sortAndFilterLocations,
	getNextShelfName,
	getNextLevelShelfName,
	getProgressStyles,
} from "../lokasi";

const loc = (over: Partial<StorageLocation>): StorageLocation =>
	({
		id: over.name || "x",
		name: "Rak 1",
		type: "Kardus",
		capacity: 10,
		usedCapacity: 5,
		isActive: true,
		...over,
	}) as StorageLocation;

describe("isKpStorageLocation", () => {
	it("menyimpan rak/kardus/pallet milik KP", () => {
		expect(isKpStorageLocation(loc({ name: "Rak 1" }))).toBe(true);
	});

	it("membuang pintu keluar & lokasi partner", () => {
		expect(isKpStorageLocation(loc({ name: "Keluar" }))).toBe(false);
		expect(isKpStorageLocation(loc({ name: "Diluar" }))).toBe(false);
		expect(isKpStorageLocation(loc({ name: "PT Naratas" }))).toBe(false);
		expect(isKpStorageLocation(loc({ name: "Gudang A", type: "PARTNER" as any }))).toBe(false);
	});
});

describe("usagePct & computeStats", () => {
	const rak = loc({
		name: "Rak 1",
		type: "Rak",
		levels: [
			{ id: "l1", name: "L1", capacity: 10, usedCapacity: 5, brandRule: "" },
			{ id: "l2", name: "L2", capacity: 10, usedCapacity: 15, brandRule: "" },
		],
	} as any);

	it("rak = akumulasi level", () => {
		expect(usagePct(rak)).toBeCloseTo(1); // 20/20
	});

	it("stats mengagregasi per tipe", () => {
		const s = computeStats([rak, loc({ name: "K-1" }), loc({ name: "P-1", type: "Pallet", capacity: 4, usedCapacity: 1 })]);
		expect(s.totalRak).toBe(1);
		expect(s.totalKardus).toBe(1);
		expect(s.totalPallet).toBe(1);
		expect(s.maxCapacity).toBe(34); // rak 20 + kardus 10 + pallet 4
		expect(s.usedCapacity).toBe(26); // rak 20 + kardus 5 + pallet 1
		expect(s.utilizationPct).toBe(76);
	});
});

describe("sortAndFilterLocations", () => {
	const a = loc({ name: "Alpha", capacity: 10, usedCapacity: 2 });
	const b = loc({ name: "Beta", capacity: 10, usedCapacity: 9 });

	it("filter search by nama", () => {
		expect(sortAndFilterLocations([a, b], { searchQuery: "alp", filterType: "kardus", sortBy: "name" })).toEqual([a]);
	});

	it("sort util-desc menaruh yang penuh di atas", () => {
		const sorted = sortAndFilterLocations([a, b], { searchQuery: "", filterType: "kardus", sortBy: "util-desc" });
		expect(sorted[0].name).toBe("Beta");
	});
});

describe("penamaan shelf", () => {
	it("getNextShelfName lanjut dari nomor tertinggi", () => {
		const locs = [loc({ name: "Shelf 2", type: "Rak" }), loc({ name: "Shelf 5", type: "Rak" })];
		expect(getNextShelfName(locs)).toBe("Shelf 6");
		expect(getNextShelfName([])).toBe("Shelf 1");
	});

	it("getNextLevelShelfName berdasar jumlah level parent", () => {
		const parent = loc({
			name: "Rak 1",
			type: "Rak",
			levels: [
				{ id: "l1", name: "A", capacity: 0, usedCapacity: 0, brandRule: "" },
				{ id: "l2", name: "B", capacity: 0, usedCapacity: 0, brandRule: "" },
			],
		} as any);
		expect(getNextLevelShelfName([parent], parent.id)).toBe("Shelf 3");
	});
});

describe("getProgressStyles", () => {
	it("<=70% memakai warna dasar", () => {
		expect(getProgressStyles(5, 10, "bg-blue-500").barClass).toBe("bg-blue-500");
	});
	it(">70% amber, >=100% merah", () => {
		expect(getProgressStyles(8, 10, "").barClass).toContain("amber");
		expect(getProgressStyles(10, 10, "").barClass).toContain("red");
	});
});

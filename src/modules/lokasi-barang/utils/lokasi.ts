import type { StorageLocation } from "@/shared/types/inventory";

export const ADMIN_LOCATION = "KP Tasikmalaya";
export const normalizeOwner = (owner?: string | null) =>
	(owner || ADMIN_LOCATION).trim().toLowerCase();

/** Nama yang sebenarnya adalah status material — bukan lokasi fisik. */
const STATUS_NAMES = new Set(["digunakan", "terdistribusi", "rusak", "hilang", "keluar", "diluar"]);

/** Lokasi yang dikelola halaman ini: gudang KP saja, tanpa pintu keluar/partner/nama status. */
export function isKpStorageLocation(loc: StorageLocation): boolean {
	const type = (loc as any).type;
	return (
		!STATUS_NAMES.has(loc.name.trim().toLowerCase()) &&
		type !== "Partner" &&
		type !== "PARTNER" &&
		!loc.name.toUpperCase().startsWith("PT ") &&
		!loc.name.toUpperCase().startsWith("PT.") &&
		(normalizeOwner((loc as any).owner) === normalizeOwner(ADMIN_LOCATION) ||
			normalizeOwner((loc as any).owner) === "kp")
	);
}

/** Persentase pemakaian satu lokasi (Rak = akumulasi level). */
export function usagePct(loc: StorageLocation): number {
	if (loc.type === "Rak") {
		let cap = 0,
			used = 0;
		loc.levels?.forEach((lvl) => {
			cap += lvl.capacity;
			used += lvl.usedCapacity;
		});
		return cap > 0 ? used / cap : 0;
	}
	const cap = loc.capacity || 0;
	return cap > 0 ? ((loc.usedCapacity || 0) / cap) : 0;
}

export interface LokasiStats {
	totalRak: number;
	totalKardus: number;
	totalPallet: number;
	maxCapacity: number;
	usedCapacity: number;
	utilizationPct: number;
	rakUsed: number;
	rakCap: number;
	kardusUsed: number;
	kardusCap: number;
	palletUsed: number;
	palletCap: number;
}

export function computeStats(locations: StorageLocation[]): LokasiStats {
	let totalRak = 0,
		totalKardus = 0,
		totalPallet = 0,
		maxCapacity = 0,
		usedCapacity = 0;
	let rakUsed = 0,
		rakCap = 0,
		kardusUsed = 0,
		kardusCap = 0,
		palletUsed = 0,
		palletCap = 0;

	locations.forEach((loc) => {
		if (loc.type === "Rak") {
			totalRak++;
			loc.levels?.forEach((lvl) => {
				maxCapacity += lvl.capacity;
				usedCapacity += lvl.usedCapacity;
				rakUsed += lvl.usedCapacity;
				rakCap += lvl.capacity;
			});
		} else if (loc.type === "Pallet") {
			totalPallet++;
			maxCapacity += loc.capacity || 0;
			usedCapacity += loc.usedCapacity || 0;
			palletUsed += loc.usedCapacity || 0;
			palletCap += loc.capacity || 0;
		} else {
			totalKardus++;
			maxCapacity += loc.capacity || 0;
			usedCapacity += loc.usedCapacity || 0;
			kardusUsed += loc.usedCapacity || 0;
			kardusCap += loc.capacity || 0;
		}
	});

	return {
		totalRak,
		totalKardus,
		totalPallet,
		maxCapacity,
		usedCapacity,
		utilizationPct: maxCapacity > 0 ? Math.round((usedCapacity / maxCapacity) * 100) : 0,
		rakUsed,
		rakCap,
		kardusUsed,
		kardusCap,
		palletUsed,
		palletCap,
	};
}

export interface LokasiFilterState {
	searchQuery: string;
	filterType: string; // "all" | "rak" | "kardus" | "pallet"
	sortBy: string; // "util-desc" | "util-asc" | "name"
}

export function sortAndFilterLocations(
	locations: StorageLocation[],
	{ searchQuery, filterType, sortBy }: LokasiFilterState
): StorageLocation[] {
	let result = locations.filter((loc) => {
		const q = searchQuery.toLowerCase();
		const matchesSearch =
			loc.name.toLowerCase().includes(q) ||
			(loc.brandRule && loc.brandRule.toLowerCase().includes(q)) ||
			(loc.levels &&
				loc.levels.some((l) => l.name.toLowerCase().includes(q) || l.brandRule.toLowerCase().includes(q)));

		const matchesType = filterType === "all" || loc.type.toLowerCase() === filterType;
		return matchesSearch && matchesType;
	});

	if (sortBy === "name") {
		result = [...result].sort((a, b) => a.name.localeCompare(b.name));
	} else if (sortBy === "util-desc" || sortBy === "util-asc") {
		result = [...result].sort((a, b) => {
			const pctA = usagePct(a);
			const pctB = usagePct(b);
			return sortBy === "util-desc" ? pctB - pctA : pctA - pctB;
		});
	}
	return result;
}

/** Nama Shelf berikutnya untuk rak baru di root. */
export function getNextShelfName(locations: StorageLocation[]): string {
	const shelfNumbers = locations
		.filter((loc) => loc.type === "Rak")
		.map((loc) => {
			const match = loc.name.match(/^Shelf\s+(\d+)$/i);
			return match ? parseInt(match[1], 10) : 0;
		});
	const nextNum = shelfNumbers.length > 0 ? Math.max(...shelfNumbers) + 1 : 1;
	return `Shelf ${nextNum}`;
}

/** Nama Shelf berikutnya di dalam satu rak (berdasar jumlah level). */
export function getNextLevelShelfName(locations: StorageLocation[], parentId?: string): string {
	if (!parentId) return "Shelf 1";
	const parent = locations.find((loc) => loc.id === parentId);
	const nextNum = (parent?.levels?.length || 0) + 1;
	return `Shelf ${nextNum}`;
}

/** Kelas warna progress bar sesuai tingkat pemakaian. */
export function getProgressStyles(used: number, cap: number, baseColor: string) {
	if (cap <= 0) return { barClass: "bg-neutral-800", textClass: "text-neutral-500", label: "0%", pct: 0 };
	const pct = Math.min(100, Math.round((used / cap) * 100));
	let barClass = baseColor;
	let textClass = "text-neutral-300";
	if (pct >= 100) {
		barClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
		textClass = "text-red-400 font-bold";
	} else if (pct > 70) {
		barClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
		textClass = "text-amber-400 font-semibold";
	}
	return { barClass, textClass, pct, label: `${pct}%` };
}

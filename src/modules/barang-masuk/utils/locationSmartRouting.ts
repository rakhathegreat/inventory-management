import { normalizeBrand, normalizeOwner } from "./validators";
import type {
	BrandOption,
	LocationDefinition,
	LokasiOption,
	InventoryItem,
} from "@/shared/types/inventory";

const ADMIN_LOCATION = "KP Tasikmalaya";

export const getRecommendedLocation = (
	brand: BrandOption,
	kondisi: string,
	kategori: string,
	locations: LocationDefinition[],
	availableCapacity: Record<string, number>,
): LokasiOption => {
	const isKabel = (kategori || "").toLowerCase() === "kabel";
	const isBaru =
		(kondisi || "").toLowerCase() === "baru" ||
		(kondisi || "").toLowerCase() === "bagus";
	const isRusak = (kondisi || "").toLowerCase() === "rusak";
	const isDismantle = (kondisi || "").toLowerCase() === "dismantle";

	const availableLocations = locations.filter((location) => {
		if ((availableCapacity[location.name] ?? 0) <= 0) return false;

		const locType = (location.type || "").toLowerCase();

		// Pallet khusus untuk Kabel
		if (locType === "pallet" && !isKabel) return false;
		if (isKabel && locType !== "pallet") return false;

		return true;
	});

	const normalizedBrand = normalizeBrand(brand);

	// Filter kandidat lokasi berdasarkan tipe yang direkomendasikan
	let preferredType = "";
	if (isBaru) preferredType = "rak";
	if (isRusak || isDismantle) preferredType = "kardus";

	let candidates = availableLocations;
	if (preferredType && !isKabel) {
		const typedCandidates = availableLocations.filter(
			(loc) => (loc.type || "").toLowerCase() === preferredType,
		);
		if (typedCandidates.length > 0) {
			candidates = typedCandidates;
		}
	}

	if (normalizedBrand) {
		const matchingLocation = candidates.find(
			(location) => normalizeBrand(location.brandRule) === normalizedBrand,
		);
		if (matchingLocation) return matchingLocation.name;
	}

	const mixedLocation = candidates.find((location) => {
		const normalizedRule = normalizeBrand(location.brandRule);
		return !normalizedRule || normalizedRule === "campuran";
	});

	return mixedLocation?.name || candidates[0]?.name || "";
};

export const getMitraDefaultLocation = (mitraName: string): LokasiOption =>
	`Gudang ${mitraName.trim() || "Mitra"}`;

/**
 * Menghitung kapasitas yang tersedia untuk setiap lokasi.
 * Dioptimalkan menggunakan frequency map (O(L + I)) agar tidak terjadi bottleneck (O(L * I)).
 */
export const calculateCapacityMap = (
	locationsData: any[],
	items: InventoryItem[],
	locationOwner: string,
): { locs: LocationDefinition[]; newKuota: Record<string, number> } => {
	// 1. Build frequency map of used capacity (O(I))
	const usedCapacityMap: Record<string, number> = {};
	items.forEach((item) => {
		if (!item.lokasiPenyimpanan) return;
		const st = (item.status || "").trim().toLowerCase();
		if (st !== "diluar" && st !== "keluar" && st !== "terdistribusi") {
			const locKey = item.lokasiPenyimpanan.trim();
			usedCapacityMap[locKey] = (usedCapacityMap[locKey] || 0) + 1;
		}
	});

	// 2. Map locations and calculate remaining capacity (O(L))
	const locs: LocationDefinition[] = [];
	const newKuota: Record<string, number> = {};

	locationsData.forEach((loc: any) => {
		if (loc.isActive === false) return;
		if (loc.name === "Keluar" || loc.name === "Diluar") return;
		if (
			normalizeOwner(loc.owner || ADMIN_LOCATION) !==
			normalizeOwner(locationOwner)
		) {
			return;
		}

		if (loc.type === "Rak" && loc.levels) {
			loc.levels.forEach((lvl: any) => {
				if (lvl.isActive === false) return;

				const name = `${loc.name} - ${lvl.name}`;
				locs.push({
					name,
					brandRule: lvl.brandRule || "Campuran",
					type: "Rak",
				});
				const actualUsed = usedCapacityMap[name] || 0;
				newKuota[name] = Math.max(0, lvl.capacity - actualUsed);
			});
		} else {
			locs.push({
				name: loc.name,
				brandRule: loc.brandRule || "Campuran",
				type: loc.type,
			});
			const actualUsed = usedCapacityMap[loc.name] || 0;
			newKuota[loc.name] = Math.max(0, (loc.capacity || 0) - actualUsed);
		}
	});

	return { locs, newKuota };
};

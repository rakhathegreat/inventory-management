import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { StorageLocation } from "@/shared/types/inventory";
import { fetchLocations } from "../api/lokasiApi";
import { computeStats, isKpStorageLocation, type LokasiStats } from "../utils/lokasi";
import { fetchItems, type ItemsQuery } from "@/modules/data-barang/api/barangApi";

export interface DistributionSlice {
	name: string;
	jumlah: number;
}

export interface MaterialStats {
	total: number;
	statusCounts: DistributionSlice[];
	kategoriTop: DistributionSlice[];
	merekTop: DistributionSlice[];
}

const TOP_N = 6;

const toSlices = (map: Map<string, number>): DistributionSlice[] => {
	if (map.size === 0) return [];
	const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
	const top = sorted.slice(0, TOP_N).map(([name, jumlah]) => ({ name, jumlah }));
	const rest = sorted.slice(TOP_N).reduce((a, [, n]) => a + n, 0);
	return rest > 0 ? [...top, { name: "Lainnya", jumlah: rest }] : top;
};

/** Ambil semua item lalu agregasi status/kategori/merek di sisi klien. */
async function aggregateMaterialStats(): Promise<MaterialStats> {
	const query: ItemsQuery = {
		page: 1,
		pageSize: 10000,
		searchTerm: "",
		filterStatus: "all",
		filterCategory: "all",
		filterBrand: "all",
		filterLocation: "all",
	};
	const json = await fetchItems(query);
	const items = Array.isArray(json?.data) ? json.data : [];

	const statusMap = new Map<string, number>();
	const kategoriMap = new Map<string, number>();
	const merekMap = new Map<string, number>();

	for (const item of items) {
		const status = item.status?.trim();
		if (status) statusMap.set(status, (statusMap.get(status) || 0) + 1);
		const kategori = item.kategori?.trim();
		if (kategori) kategoriMap.set(kategori, (kategoriMap.get(kategori) || 0) + 1);
		const merek = item.merek?.trim();
		if (merek) merekMap.set(merek, (merekMap.get(merek) || 0) + 1);
	}

	return {
		total: json?.pagination?.totalItems ?? items.length,
		statusCounts: [...statusMap.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([name, jumlah]) => ({ name, jumlah })),
		kategoriTop: toSlices(kategoriMap),
		merekTop: toSlices(merekMap),
	};
}

/** Data tab Statistik: okupansi gudang KP + ringkasan material. */
export function useStatistikGudang() {
	const [locations, setLocations] = useState<StorageLocation[]>([]);
	const [materialStats, setMaterialStats] = useState<MaterialStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [locs, materials] = await Promise.all([fetchLocations(), aggregateMaterialStats()]);
			setLocations(locs.filter(isKpStorageLocation));
			setMaterialStats(materials);
		} catch (e: any) {
			setError(e.message || "Gagal memuat statistik.");
			toast.error(e.message || "Gagal memuat statistik.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const stats = useMemo(() => computeStats(locations), [locations]);

	return { stats, materialStats, isLoading, error, reload: load };
}

export type { LokasiStats };

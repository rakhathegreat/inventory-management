import { useEffect, useState } from "react";
import { fetchCategories } from "@/modules/kategori-barang/api/kategoriApi";
import { fetchModels } from "@/modules/tipe-material/api/tipeMaterialApi";
import { fetchBrands } from "@/modules/merek-barang/api/merekApi";

export interface RegistryCounts {
	kategori?: number;
	model?: number;
	merek?: number;
}

export function useRegistryCounts(reloadKey: string): { counts: RegistryCounts; isLoading: boolean } {
	const [counts, setCounts] = useState<RegistryCounts>({});

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			const [kategori, model, merek] = await Promise.allSettled([
				fetchCategories(),
				fetchModels(),
				fetchBrands(),
			]);
			if (cancelled) return;
			setCounts({
				kategori: kategori.status === "fulfilled" && Array.isArray(kategori.value) ? kategori.value.length : undefined,
				model: model.status === "fulfilled" && Array.isArray(model.value) ? model.value.length : undefined,
				merek: merek.status === "fulfilled" && Array.isArray(merek.value) ? merek.value.length : undefined,
			});
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [reloadKey]);

	const isLoading =
		counts.kategori === undefined && counts.model === undefined && counts.merek === undefined;

	return { counts, isLoading };
}

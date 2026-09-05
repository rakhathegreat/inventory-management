import type {
	StorageLocationOption,
	MaterialModel,
} from "@/shared/types/inventory";
import type { ComboboxItem } from "@/shared/ui/combobox";

export const ADMIN_LOCATION = "KP Tasikmalaya";

export const getBaseUrl = () => {
	const baseUrl =
		import.meta.env.URL ||
		import.meta.env.VITE_URL ||
		"http://172.168.9.139:3000/";
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

export const getHeaders = () => {
	const token = localStorage.getItem("arxiva-auth-token");
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `${token}`;
	}
	return headers;
};

export interface AuxiliaryData {
	categories: string[];
	brands: string[];
	models: MaterialModel[];
	locations: StorageLocationOption[];
}

const parseList = (raw: any): any[] =>
	raw?.data || (Array.isArray(raw) ? raw : []);

const SEARCH_LIMIT = 20;

const searchMasterData = async (
	path: string,
	query: string,
	params: Record<string, string> = {},
): Promise<any[]> => {
	const url = new URL(`${getBaseUrl()}/${path}`);
	url.searchParams.set("search", query);
	url.searchParams.set("limit", String(SEARCH_LIMIT));
	Object.entries(params).forEach(([key, value]) => {
		if (value) url.searchParams.set(key, value);
	});
	const res = await fetch(url.toString(), { method: "GET", headers: getHeaders() });
	if (!res.ok) throw new Error(`Gagal memuat ${path}`);
	return parseList(await res.json());
};

export const searchCategories = async (query: string): Promise<ComboboxItem[]> => {
	const rows = await searchMasterData("categories", query);
	return Array.from(
		new Set(rows.map((c: any) => c.nama || c.name || "").filter(Boolean)),
	)
		.sort((a, b) => a.localeCompare(b))
		.map((nama) => ({ value: nama, label: nama }));
};

export const searchBrands = async (query: string): Promise<ComboboxItem[]> => {
	const rows = await searchMasterData("brands", query);
	return Array.from(
		new Set(rows.map((b: any) => b.nama || b.name || "").filter(Boolean)),
	)
		.sort((a, b) => a.localeCompare(b))
		.map((nama) => ({ value: nama, label: nama }));
};

export const searchModels = async (
	query: string,
	brand = "",
): Promise<ComboboxItem[]> => {
	const rows = await searchMasterData("material-models", query, { brand });
	const seen = new Set<string>();
	const list: ComboboxItem[] = [];
	rows.forEach((m: any) => {
		const nama = m.nama;
		if (!nama || seen.has(nama)) return;
		seen.add(nama);
		list.push({
			value: nama,
			label: nama,
			description: m.brand?.nama || m.brand?.name || undefined,
		});
	});
	return list.sort((a, b) => a.label.localeCompare(b.label));
};

export const searchLocations = async (query: string): Promise<ComboboxItem[]> => {
	const rows = await searchMasterData("locations", query);
	return flattenLocations(rows).map((loc) => ({
		value: loc.name,
		label: loc.name,
	}));
};

export const fetchAuxiliary = async (): Promise<AuxiliaryData> => {
	const [resCat, resLoc, resBrand, resModels] = await Promise.all([
		fetch(`${getBaseUrl()}/categories`, {
			method: "GET",
			headers: getHeaders(),
		}),
		fetch(`${getBaseUrl()}/locations`, {
			method: "GET",
			headers: getHeaders(),
		}),
		fetch(`${getBaseUrl()}/brands`, { method: "GET", headers: getHeaders() }),
		fetch(`${getBaseUrl()}/material-models`, {
			method: "GET",
			headers: getHeaders(),
		}),
	]);

	const result: AuxiliaryData = {
		categories: [],
		brands: [],
		models: [],
		locations: [],
	};

	if (resCat.ok) {
		result.categories = parseList(await resCat.json())
			.map((c: any) => c.nama || c.name || "")
			.filter(Boolean);
	}

	if (resBrand.ok) {
		result.brands = Array.from(
			new Set(
				parseList(await resBrand.json())
					.map((b: any) => b.nama || b.name || "")
					.filter(Boolean),
			),
		);
	}

	if (resModels.ok) {
		result.models = parseList(await resModels.json()) as MaterialModel[];
	}

	if (resLoc.ok) {
		result.locations = flattenLocations(parseList(await resLoc.json()));
	}

	return result;
};

/**
 * Ratakan lokasi bersarang (Rak → levels) jadi daftar opsi { name, owner }.
 * Hanya tampilkan lokasi milik admin (KP).
 */
export function flattenLocations(
	locationsData: any[],
): StorageLocationOption[] {
	const locs: StorageLocationOption[] = [];
	if (!Array.isArray(locationsData)) return locs;

	const normKp = ADMIN_LOCATION.trim().toLowerCase();
	locationsData.forEach((loc: any) => {
		const owner = loc.owner || ADMIN_LOCATION;
		const normOwner = owner.trim().toLowerCase();
		if (
			(normOwner !== normKp && normOwner !== "kp") ||
			loc.type === "Partner" ||
			loc.type === "PARTNER" ||
			loc.name.toUpperCase().startsWith("PT ") ||
			loc.name.toUpperCase().startsWith("PT.")
		) {
			return;
		}
		if (loc.type === "Rak" && loc.levels) {
			loc.levels.forEach((lvl: any) =>
				locs.push({ name: `${loc.name} - ${lvl.name}`, owner }),
			);
		} else {
			locs.push({ name: loc.name, owner });
		}
	});
	return locs;
}

export interface ItemsQuery {
	page: number;
	pageSize: number;
	searchTerm: string;
	filterStatus: string;
	filterCategory: string;
	filterBrand: string;
	filterLocation: string;
}

export const fetchItems = async (query: ItemsQuery) => {
	const params = new URLSearchParams();
	params.append("page", query.page.toString());
	params.append("limit", query.pageSize.toString());
	if (query.searchTerm.trim()) params.append("search", query.searchTerm.trim());
	if (query.filterStatus !== "all") params.append("status", query.filterStatus);
	if (query.filterCategory !== "all")
		params.append("kategori", query.filterCategory);
	if (query.filterBrand !== "all") params.append("merek", query.filterBrand);
	if (query.filterLocation !== "all")
		params.append("lokasi", query.filterLocation);

	const res = await fetch(`${getBaseUrl()}/items?${params.toString()}`, {
		method: "GET",
		headers: getHeaders(),
	});

	if (!res.ok) throw new Error("Gagal memuat data barang");
	return res.json();
};

export interface BarangPayload {
	serialNumber: string;
	kategori: string;
	merek: string;
	tipe?: string;
	status: string;
	kondisi: string;
	lokasiPenyimpanan: string;
	mitra: string;
	ticket?: string | null;
	catatan?: string | null;
}
export const createItem = async (payload: BarangPayload): Promise<void> => {
	const resAdd = await fetch(`${getBaseUrl()}/items`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify(payload),
	});
	if (!resAdd.ok) throw new Error("Gagal menyimpan unit.");
};

export const updateItem = async (
	id: string,
	payload: BarangPayload,
): Promise<void> => {
	const resUpdate = await fetch(`${getBaseUrl()}/items/${id}`, {
		method: "PUT",
		headers: getHeaders(),
		body: JSON.stringify(payload),
	});
	if (!resUpdate.ok) throw new Error("Gagal memperbarui unit.");
};

export const deleteItemsByIds = async (ids: string[]): Promise<void> => {
	await Promise.all(
		ids.map((id) =>
			fetch(`${getBaseUrl()}/items/${id}`, {
				method: "DELETE",
				headers: getHeaders(),
			}),
		),
	);
};

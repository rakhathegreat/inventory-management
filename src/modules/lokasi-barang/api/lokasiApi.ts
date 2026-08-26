import type { StorageLocation } from "@/shared/types/inventory";

const getBaseUrl = () => {
	const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "";
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const getHeaders = () => {
	const token = localStorage.getItem("arxiva-auth-token");
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = `${token}`;
	return headers;
};

async function unwrap<T>(res: Response, fallbackMessage: string): Promise<T> {
	if (!res.ok) {
		const e = await res.json().catch(() => ({}));
		throw new Error((e as { message?: string }).message || fallbackMessage);
	}
	return res.json() as Promise<T>;
}

async function postLocation(payload: Record<string, unknown>) {
	return fetch(`${getBaseUrl()}/locations`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify(payload),
	});
}

/** Ambil seluruh lokasi dari server (filter KP dilakukan di utils). */
export async function fetchLocations(): Promise<StorageLocation[]> {
	const json = await unwrap<{ data?: StorageLocation[] } | StorageLocation[]>(
		await fetch(`${getBaseUrl()}/locations`, { method: "GET", headers: getHeaders() }),
		"Gagal mengambil data lokasi"
	);
	return (Array.isArray(json) ? json : json.data) || [];
}

/** Nama brand untuk Aturan Merek; fallback daftar statis bila gagal. */
export async function fetchBrandNames(): Promise<string[]> {
	try {
		const data = await unwrap<any>(
			await fetch(`${getBaseUrl()}/brands`, { method: "GET", headers: getHeaders() }),
			"Gagal mengambil data merek"
		);
		const list = data.data || data.brands || data || [];
		return ["Campuran", ...list.map((b: any) => b.nama || b.name)];
	} catch {
		return ["Campuran", "Huawei", "ZTE", "Nokia", "FiberHome"];
	}
}

export const createRak = async (name: string, levelCount: number) =>
	unwrap(
		await postLocation({
			name,
			type: "Rak",
			levels: Array.from({ length: levelCount }).map((_, i) => ({
				name: `Shelf ${i + 1}`,
				capacity: 0,
				brandRule: "Campuran",
			})),
		}),
		"Gagal menambahkan rak"
	);

export const createKardus = async (name: string, capacity: number, brandRule: string) =>
	unwrap(await postLocation({ name, type: "Kardus", capacity, brandRule }), "Gagal menambahkan kardus");

export const createPallet = async (name: string, capacity: number, brandRule: string) =>
	unwrap(await postLocation({ name, type: "Pallet", capacity, brandRule }), "Gagal menambahkan pallet");

export const createLevel = async (
	parentId: string,
	name: string,
	capacity: number,
	brandRule: string
) =>
	unwrap(
		await postLocation({ name, type: "BOX", parentId, capacity, brandRule }),
		"Gagal menambahkan level"
	);

export const updateRakName = async (id: string, name: string) =>
	unwrap(
		await fetch(`${getBaseUrl()}/locations/${id}`, {
			method: "PUT",
			headers: getHeaders(),
			body: JSON.stringify({ name }),
		}),
		"Gagal memperbarui rak"
	);

export const updateStorageUnit = async (
	id: string,
	payload: { name: string; capacity: number; brandRule: string },
	typeLabel: string
) =>
	unwrap(
		await fetch(`${getBaseUrl()}/locations/${id}`, {
			method: "PUT",
			headers: getHeaders(),
			body: JSON.stringify(payload),
		}),
		`Gagal memperbarui ${typeLabel}`
	);

export const updateLevel = async (levelId: string, capacity: number, brandRule: string) =>
	unwrap(
		await fetch(`${getBaseUrl()}/locations/${levelId}`, {
			method: "PUT",
			headers: getHeaders(),
			body: JSON.stringify({ capacity, brandRule }),
		}),
		"Gagal memperbarui level"
	);

export const toggleActive = async (id: string, isActive: boolean) =>
	unwrap(
		await fetch(`${getBaseUrl()}/locations/${id}/toggle`, {
			method: "PATCH",
			headers: getHeaders(),
			body: JSON.stringify({ isActive }),
		}),
		"Gagal mengubah status lokasi"
	);

export const deleteLocation = async (id: string) =>
	unwrap(
		await fetch(`${getBaseUrl()}/locations/${id}`, { method: "DELETE", headers: getHeaders() }),
		"Gagal menghapus"
	);

/** Pindahkan seluruh item dari lokasi sumber ke lokasi tujuan (admin). */
export async function migrateLocationItems(
	sourceId: string,
	targetLocationId: string,
): Promise<{ message: string; moved: number; targetName: string }> {
	return unwrap<{ message: string; moved: number; targetName: string }>(
		await fetch(`${getBaseUrl()}/locations/${sourceId}/migrate-items`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify({ targetLocationId: Number(targetLocationId) }),
		}),
		"Gagal memindahkan item.",
	);
}

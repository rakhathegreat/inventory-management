const getBaseUrl = () => {
	const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "http://172.168.9.139:3000/";
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const getHeaders = () => {
	const token = localStorage.getItem("arxiva-auth-token");
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = `${token}`;
	return headers;
};

async function unwrapError(res: Response, fallback: string) {
	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		throw new Error(errData.message || errData.error || fallback);
	}
}

export const fetchCategories = async () => {
	const response = await fetch(`${getBaseUrl()}/categories`, { method: "GET", headers: getHeaders() });
	if (!response.ok) throw new Error("Gagal mengambil data kategori");
	const data = await response.json();
	const categoriesList = data.data || data.categories || data;
	return Array.isArray(categoriesList)
		? categoriesList.map((c: any) => ({
				...c,
				id: String(c.id),
				name: c.nama || c.name || "",
				typeId: String(c.typeId || ""),
				description: c.type?.nama || c.deskripsi || c.description || "",
				totalItems: c.totalItems !== undefined ? c.totalItems : (c.total_items || 0),
				safetyStock: c.safetyStock !== undefined ? c.safetyStock : (c.safety_stock || 5),
			}))
		: [];
};

export const fetchMaterialModels = async (): Promise<any[]> => {
	const response = await fetch(`${getBaseUrl()}/material-models`, { method: "GET", headers: getHeaders() });
	return response.ok ? response.json() : [];
};

export const createCategory = async (payload: Record<string, unknown>) =>
	unwrapError(
		await fetch(`${getBaseUrl()}/categories`, {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify(payload),
		}),
		"Gagal menambahkan kategori",
	);

export const updateCategory = async (id: string, payload: Record<string, unknown>) =>
	unwrapError(
		await fetch(`${getBaseUrl()}/categories/${id}`, {
			method: "PUT",
			headers: getHeaders(),
			body: JSON.stringify(payload),
		}),
		"Gagal memperbarui kategori",
	);

export const deleteCategoryById = async (id: string) =>
	unwrapError(
		await fetch(`${getBaseUrl()}/categories/${id}`, { method: "DELETE", headers: getHeaders() }),
		"Gagal menghapus kategori",
	);

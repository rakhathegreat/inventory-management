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

export const fetchBrands = async () => {
	const response = await fetch(`${getBaseUrl()}/brands`, { method: "GET", headers: getHeaders() });
	if (!response.ok) throw new Error("Gagal mengambil data merek");
	const data = await response.json();
	const brandsList = data.data || data.brands || data;
	return Array.isArray(brandsList)
		? brandsList.map((b: any) => ({
				...b,
				id: String(b.id),
				totalItems: b.totalItems !== undefined ? b.totalItems : (b.total_items || 0),
			}))
		: [];
};

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
			}))
		: [];
};

export const createBrand = async (payload: Record<string, unknown>) => {
	const response = await fetch(`${getBaseUrl()}/brands`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify(payload),
	});
	if (!response.ok) {
		const errData = await response.json().catch(() => ({}));
		throw new Error(errData.message || errData.error || "Gagal menambahkan merek");
	}
};

export const updateBrand = async (
	id: string,
	payload: Record<string, unknown>,
	currentTotalItems?: number,
) => {
	const response = await fetch(`${getBaseUrl()}/brands/${id}`, {
		method: "PUT",
		headers: getHeaders(),
		body: JSON.stringify({ ...payload, totalItems: currentTotalItems || 0 }),
	});
	if (!response.ok) {
		const errData = await response.json().catch(() => ({}));
		throw new Error(errData.message || errData.error || "Gagal memperbarui merek");
	}
};

export const deleteBrandById = async (id: string) => {
	const response = await fetch(`${getBaseUrl()}/brands/${id}`, { method: "DELETE", headers: getHeaders() });
	if (!response.ok) {
		const errData = await response.json().catch(() => ({}));
		throw new Error(errData.message || errData.error || "Gagal menghapus merek");
	}
};

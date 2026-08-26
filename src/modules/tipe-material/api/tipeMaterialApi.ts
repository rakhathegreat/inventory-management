const getBaseUrl = () => {
	const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "http://172.168.9.139:3000/";
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const getHeaders = () => {
	const token = localStorage.getItem("arxiva-auth-token");
	return {
		"Content-Type": "application/json",
		...(token ? { Authorization: token } : {}),
	};
};

export const fetchModels = async (): Promise<any[]> => {
	try {
		const res = await fetch(`${getBaseUrl()}/material-models`, { headers: getHeaders() });
		return res.ok ? res.json() : [];
	} catch {
		throw new Error("Gagal mengambil data model material.");
	}
};

export const fetchBrands = async (): Promise<any[]> => {
	try {
		const res = await fetch(`${getBaseUrl()}/brands`, { headers: getHeaders() });
		if (!res.ok) return [];
		const data = await res.json();
		return Array.isArray(data) ? data : data.data || data.brands || [];
	} catch {
		return [];
	}
};

export const fetchCategories = async (): Promise<any[]> => {
	try {
		const res = await fetch(`${getBaseUrl()}/categories`, { headers: getHeaders() });
		if (!res.ok) return [];
		const data = await res.json();
		return Array.isArray(data) ? data : data.data || data.categories || [];
	} catch {
		return [];
	}
};

export const saveModel = async (
	editId: string | null,
	payload: Record<string, unknown>,
): Promise<void> => {
	const url = `${getBaseUrl()}/material-models${editId ? `/${editId}` : ""}`;
	const method = editId ? "PUT" : "POST";
	const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		throw new Error(errData.message || "Gagal menyimpan model material");
	}
};

export const deleteModelById = async (id: string): Promise<void> => {
	const res = await fetch(`${getBaseUrl()}/material-models/${id}`, {
		method: "DELETE",
		headers: getHeaders(),
	});
	if (!res.ok) throw new Error("Gagal menghapus");
};

import type { InventoryItem } from "@/shared/types/inventory";
import type { Partner } from "@/shared/types/partner";

const getBaseUrl = () => {
	const baseUrl =
		import.meta.env.URL || import.meta.env.VITE_URL || "http://172.168.9.139:3000/";
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const getHeaders = () => {
	const token = localStorage.getItem("arxiva-auth-token");
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = `${token}`;
	return headers;
};

async function parseArray<T>(res: Response): Promise<T[]> {
	const raw = await res.json();
	return Array.isArray(raw.data || raw) ? raw.data || raw : [];
}

export const fetchAllItems = async (): Promise<InventoryItem[]> =>
	parseArray<InventoryItem>(
		await fetch(`${getBaseUrl()}/items`, { method: "GET", headers: getHeaders() }),
	);

export interface PartnerRaw {
	id?: string;
	username?: string;
	role?: string;
	isAktif?: boolean;
	isActive?: boolean;
	code?: string;
	name?: string;
	email?: string;
	phone?: string;
	address?: string;
	partnerType?: string;
	contactPerson?: string;
	profile?: {
		code?: string;
		nama?: string;
		name?: string;
		partnerType?: string;
		contactPerson?: string;
		telepon?: string;
		phone?: string;
		email?: string;
		alamat?: string;
		address?: string;
	};
}

/** GET /users → daftar mitra aktif (shape sama dengan mapping lama). */
export const fetchActivePartners = async (): Promise<Partner[]> => {
	const rawPartners = await (
		await fetch(`${getBaseUrl()}/users`, { method: "GET", headers: getHeaders() })
	).json();
	const usersList = rawPartners.data || rawPartners.users || rawPartners;
	const partners: Partner[] = (Array.isArray(usersList) ? usersList : [])
		.filter((u: any) => u.role === "MITRA")
		.map((u: any) => ({
			id: String(u.id),
			code: u.profile?.code || u.code || "-",
			name:
				u.profile?.nama ||
				u.profile?.name ||
				u.name ||
				u.username ||
				"",
			partnerType: u.profile?.partnerType || u.partnerType || "Supplier",
			contactPerson: u.profile?.contactPerson || u.contactPerson || "-",
			phone: u.profile?.telepon || u.profile?.phone || u.phone || "-",
			email: u.profile?.email || u.email || "-",
			address: u.profile?.alamat || u.profile?.address || u.address || "-",
			isActive:
				u.isAktif !== undefined
					? u.isAktif
					: u.isActive !== undefined
						? u.isActive
						: true,
			username: u.username || null,
		}));
	return partners.filter((partner) => partner.isActive);
};

export type { Partner };

export const fetchLocationsRaw = async (): Promise<any[]> => {
	const rawLoc = await (
		await fetch(`${getBaseUrl()}/locations`, { method: "GET", headers: getHeaders() })
	).json();
	const locationsData = rawLoc.data || rawLoc;
	return Array.isArray(locationsData) ? locationsData : [];
};

export const fetchTransactionsRaw = async (): Promise<any[]> => {
	const rawTrx = await (
		await fetch(`${getBaseUrl()}/transactions`, { method: "GET", headers: getHeaders() })
	).json();
	const txs = rawTrx.data || rawTrx;
	return Array.isArray(txs) ? txs : [];
};

export const updateItemOutboundStatus = async (
	id: string,
	payload: object,
	sn: string,
) => {
	const res = await fetch(`${getBaseUrl()}/items/${id}`, {
		method: "PUT",
		headers: getHeaders(),
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Gagal update item ${sn}`);
};

export const createTransactionRecord = async (
	payload: Record<string, unknown>,
	sn: string,
) => {
	const res = await fetch(`${getBaseUrl()}/transactions`, {
		method: "POST",
		headers: getHeaders(),
		body: JSON.stringify(payload),
	});
	if (!res.ok) throw new Error(`Gagal mencatat transaksi ${sn}`);
};

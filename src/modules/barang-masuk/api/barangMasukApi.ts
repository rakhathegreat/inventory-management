import type { InventoryItem, BrandDefinition } from "@/shared/types/inventory";
import type { Partner } from "@/shared/types/partner";
import type { ComboboxItem } from "@/shared/ui/combobox";
import type { BarangMasukItem } from "@/modules/transaksi/types";
import { toIntakePayload } from "../utils/inboundDecision";

/**
 * Helper: Mengembalikan Base URL untuk pemanggilan API.
 * 
 * @returns {string} String URL API Backend.
 */
export const getBaseUrl = () => {
  const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "http://172.168.9.139:3000/";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

/**
 * Helper: Menyusun header HTTP secara otomatis beserta Authorization token.
 * 
 * @returns {Record<string, string>} Object header HTTP.
 */
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

export const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const resItems = await fetch(`${getBaseUrl()}/items`, { method: "GET", headers: getHeaders() });
    const rawItems = await resItems.json();
    return Array.isArray(rawItems.data || rawItems) ? (rawItems.data || rawItems) : [];
  } catch (error) {
    console.error("Gagal memperbarui data barang dari server:", error);
    throw new Error("Gagal memperbarui data barang dari server.");
  }
};

const ASAL_FIXED_SOURCES = ["Kantor Pusat", "SBU Regional Jawa Barat"];

/**
 * Cari daftar "asal material" (sumber tetap + mitra aktif) dari backend.
 * Dipakai combobox lazy pencarian asal material di halaman barang masuk.
 */
export const searchAsalMaterial = async (query: string): Promise<ComboboxItem[]> => {
  const q = query.trim().toLowerCase();
  const items: ComboboxItem[] = [];
  const seen = new Set<string>();
  ASAL_FIXED_SOURCES.filter((name) => name.toLowerCase().includes(q)).forEach((name) => {
    seen.add(name);
    items.push({ value: name, label: name });
  });
  try {
    const res = await fetch(
      `${getBaseUrl()}/users?search=${encodeURIComponent(query)}&limit=20`,
      { method: "GET", headers: getHeaders() },
    );
    if (res.ok) {
      const raw = await res.json();
      const users = Array.isArray(raw.data || raw.users || raw)
        ? (raw.data || raw.users || raw)
        : [];
      users.forEach((u: any) => {
        if (u.role !== "MITRA" || u.isAktif === false) return;
        const name = u.profile?.nama || u.profile?.name || u.name || u.username || "";
        if (!name || seen.has(name)) return;
        seen.add(name);
        items.push({ value: name, label: name });
      });
    }
  } catch {
    // Hasil dari sumber tetap tetap ditampilkan meski request gagal.
  }
  return items.sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Cari material-model (nama / merek / kategori) dari backend untuk combobox
 * pemilihan model yang lazy — tidak memuat seluruh master model di halaman.
 */
export const searchMaterialModels = async (query: string): Promise<ComboboxItem[]> => {
  const res = await fetch(
    `${getBaseUrl()}/material-models?search=${encodeURIComponent(query)}&limit=20`,
    { method: "GET", headers: getHeaders() },
  );
  if (!res.ok) throw new Error("Gagal memuat model");
  const raw = await res.json();
  const rows = Array.isArray(raw.data || raw) ? (raw.data || raw) : [];
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

export interface IntakeItemResult {
  index: number;
  ok: boolean;
  itemId?: string;
  nomor?: string;
  reason?: string;
  detail?: Record<string, unknown>;
}

/**
 * Kirim seluruh sesi barang masuk ke endpoint bulk server-authoritative.
 * Per-item atomic: hasil per item dikembalikan, item valid tetap tersimpan.
 */
export const submitInboundSession = async (
  items: BarangMasukItem[]
): Promise<{ results: IntakeItemResult[] }> => {
  const res = await fetch(`${getBaseUrl()}/intake`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      items: items.map((item) => toIntakePayload(item, new Date().toISOString().slice(0, 10))),
    }),
  });
  const raw = await res.json();
  if (!res.ok || !Array.isArray(raw?.results)) {
    throw new Error(raw?.message || "Endpoint intake tidak merespons dengan benar.");
  }
  return raw as { results: IntakeItemResult[] };
};

export interface MasterDataResponse {
  partners: Partner[];
  brands: BrandDefinition[];
  categories: string[];
  models: any[];
  items: InventoryItem[];
  locations: any[]; // Raw locations data
}

/**
 * Mengambil master data secara paralel menggunakan Promise.all untuk mencegah waterfall bottleneck.
 */
export const fetchBarangMasukMasterData = async (): Promise<MasterDataResponse> => {
  const [
    resPartners,
    resBrands,
    resCat,
    resModels,
    items,
    resLoc
  ] = await Promise.all([
    fetch(`${getBaseUrl()}/users`, { method: "GET", headers: getHeaders() }),
    fetch(`${getBaseUrl()}/brands`, { method: "GET", headers: getHeaders() }),
    fetch(`${getBaseUrl()}/categories`, { method: "GET", headers: getHeaders() }),
    fetch(`${getBaseUrl()}/material-models`, { method: "GET", headers: getHeaders() }),
    fetchInventoryItems(),
    fetch(`${getBaseUrl()}/locations`, { method: "GET", headers: getHeaders() }),
  ]);

  const [rawPartners, rawBrands, rawCat, rawModels, rawLoc] = await Promise.all([
    resPartners.json(),
    resBrands.json(),
    resCat.json(),
    resModels.json(),
    resLoc.json(),
  ]);

  const usersList = rawPartners.data || rawPartners.users || rawPartners;
  const partners: Partner[] = (Array.isArray(usersList) ? usersList : [])
    .filter((u: any) => u.role === "MITRA")
    .map((u: any) => ({
      id: String(u.id),
      code: u.profile?.code || u.code || "-",
      name: u.profile?.nama || u.profile?.name || u.name || u.username || "",
      partnerType: u.profile?.partnerType || u.partnerType || "Supplier",
      contactPerson: u.profile?.contactPerson || u.contactPerson || "-",
      phone: u.profile?.telepon || u.profile?.phone || u.phone || "-",
      email: u.profile?.email || u.email || "-",
      address: u.profile?.alamat || u.profile?.address || u.address || "-",
      isActive: u.isAktif !== undefined ? u.isAktif : (u.isActive !== undefined ? u.isActive : true),
      username: u.username || null,
    }))
    .filter(partner => partner.isActive);

  const brandsData = rawBrands.data || rawBrands;
  const brands: BrandDefinition[] = (Array.isArray(brandsData) ? brandsData : []).map((brand: any) => ({
    name: brand.name || brand.nama || "",
    identifier: brand.identifier || "",
  }));

  const catData = rawCat.data || rawCat;
  const categories: string[] = (Array.isArray(catData) ? catData : []).map((c: any) => c.name || c.nama || "");

  const models: any[] = Array.isArray(rawModels.data || rawModels) ? (rawModels.data || rawModels) : [];
  
  const locationsData = rawLoc.data || rawLoc;
  const locations: any[] = Array.isArray(locationsData) ? locationsData : [];

  return {
    partners,
    brands,
    categories,
    models,
    items,
    locations
  };
};

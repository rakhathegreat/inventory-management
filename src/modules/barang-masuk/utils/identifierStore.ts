import type { BrandDefinition } from "@/shared/types/inventory";

const STORAGE_KEY = "arxiva-brand-identifiers";

export interface IdentifierEntry {
	name: string;
	identifier: string;
}

/** Simpan daftar identifier merek ke localStorage (dipanggil setelah master data termuat). */
export function saveIdentifiers(brands: BrandDefinition[]): void {
	const entries: IdentifierEntry[] = brands
		.map((b) => ({ name: b.name, identifier: (b.identifier || "").trim().toUpperCase() }))
		.filter((e) => e.identifier !== "");
	localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Ambil daftar identifier tersimpan; [] bila belum pernah disimpan. */
export function loadIdentifiers(): IdentifierEntry[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

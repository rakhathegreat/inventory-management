import type { Merek } from "@/shared/types/inventory";

export function filterBrands(brands: Merek[], searchQuery: string): Merek[] {
	const q = searchQuery.toLowerCase();
	return brands.filter(
		(brand) =>
			brand.nama.toLowerCase().includes(q) ||
			brand.identifier.toLowerCase().includes(q) ||
			(brand.origin || "").toLowerCase().includes(q),
	);
}

export interface BrandFormInput {
	name: string;
	identifier: string;
}

/**
 * Validasi form merek + auto-generate identifier dari 3 huruf pertama bila kosong.
 * PURE — cek duplikasi nama & identifier terhadap daftar existing.
 */
export function validateBrandForm(
	input: BrandFormInput,
	brands: Merek[],
	editId: string | null,
): { errors: Record<string, string>; normalizedIdentifier: string; trimmedName: string } {
	const trimmedName = input.name.trim();
	const normalizedIdentifier =
		input.identifier.trim().toUpperCase() || trimmedName.slice(0, 3).toUpperCase();

	const errors: Record<string, string> = {};
	if (!trimmedName) errors.name = "Nama merek wajib diisi.";
	if (!normalizedIdentifier) errors.identifier = "Identifier merek wajib diisi.";

	const duplicateName = brands.some(
		(brand) =>
			brand.id !== editId && brand.nama.trim().toLowerCase() === trimmedName.toLowerCase(),
	);
	if (duplicateName) errors.name = "Nama merek sudah terdaftar.";

	const duplicateIdentifier = brands.some(
		(brand) =>
			brand.id !== editId &&
			brand.identifier.trim().toLowerCase() === normalizedIdentifier.toLowerCase(),
	);
	if (duplicateIdentifier) errors.identifier = "Identifier merek sudah digunakan.";

	return { errors, normalizedIdentifier, trimmedName };
}

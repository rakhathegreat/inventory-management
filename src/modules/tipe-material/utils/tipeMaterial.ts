export interface ModelRow {
	id: any;
	nama: string;
	code?: string;
	brand?: { nama?: string } | null;
	materialCategory?: { nama?: string } | null;
	[key: string]: any;
}

export function filterModels(models: ModelRow[], searchQuery: string): ModelRow[] {
	const q = searchQuery.toLowerCase();
	return models.filter(
		(t) =>
			t.nama?.toLowerCase().includes(q) ||
			t.code?.toLowerCase().includes(q) ||
			t.brand?.nama?.toLowerCase().includes(q) ||
			t.materialCategory?.nama?.toLowerCase().includes(q),
	);
}

export interface ModelFormInput {
	name: string;
	code: string;
	brandId: string;
	materialCategoryId: string;
}

/**
 * Validasi form model material. PURE — cek duplikasi nama terhadap daftar existing.
 */
export function validateModelForm(
	input: ModelFormInput,
	models: ModelRow[],
	editId: any,
): Record<string, string> {
	const errors: Record<string, string> = {};
	const normalizedName = input.name.trim();

	if (!input.brandId) errors.brand = "Merek wajib dipilih.";
	if (!input.materialCategoryId) errors.category = "Kategori wajib dipilih.";
	if (!normalizedName) errors.name = "Nama model material wajib diisi.";

	const duplicateName = models.some(
		(t) =>
			String(t.id) !== String(editId ?? "") &&
			(t.nama || "").trim().toLowerCase() === normalizedName.toLowerCase() &&
			normalizedName !== "",
	);
	if (duplicateName) errors.name = "Nama model material sudah terdaftar.";

	return errors;
}

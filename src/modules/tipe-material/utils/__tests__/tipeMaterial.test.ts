import { describe, it, expect } from "vitest";
import { filterModels, validateModelForm } from "../tipeMaterial";

const model = (over: Record<string, any> = {}) => ({
	id: "1",
	nama: "Model A",
	code: "MDA",
	brand: { nama: "Brand X" },
	materialCategory: { nama: "Kat 1" },
	...over,
});

describe("filterModels", () => {
	it("filter kosong mengembalikan semua", () => {
		const models = [model(), model({ id: "2", nama: "Model B" })];
		expect(filterModels(models, "")).toHaveLength(2);
	});

	it("mencocokkan nama, kode, brand, dan kategori", () => {
		const models = [
			model(),
			model({ id: "2", nama: "Lain", code: "XYZ" }),
			model({ id: "3", nama: "Lain", code: "AAA", brand: { nama: "Brand Y" } }),
			model({ id: "4", nama: "Lain", materialCategory: { nama: "Kat Spesial" } }),
		];
		expect(filterModels(models, "model a")).toHaveLength(1);
		expect(filterModels(models, "xyz")).toHaveLength(1);
		expect(filterModels(models, "brand y")).toHaveLength(1);
		expect(filterModels(models, "spesial")).toHaveLength(1);
		expect(filterModels(models, "tidakada")).toHaveLength(0);
	});
});

describe("validateModelForm", () => {
	it("wajib isi nama, merek, kategori", () => {
		const errors = validateModelForm({ name: "", code: "", brandId: "", materialCategoryId: "" }, [], null);
		expect(errors.name).toBe("Nama model material wajib diisi.");
		expect(errors.brand).toBe("Merek wajib dipilih.");
		expect(errors.category).toBe("Kategori wajib dipilih.");
	});

	it("deteksi duplikasi nama (case-insensitive) kecuali diri sendiri saat edit", () => {
		const models = [model({ nama: "Model A" })];
		const dup = validateModelForm(
			{ name: "  model a  ", code: "", brandId: "1", materialCategoryId: "1" },
			models,
			null,
		);
		expect(dup.name).toBe("Nama model material sudah terdaftar.");

		const editSelf = validateModelForm(
			{ name: "Model A", code: "", brandId: "1", materialCategoryId: "1" },
			models,
			"1",
		);
		expect(editSelf.name).toBeUndefined();
	});

	it("form valid tanpa error", () => {
		const errors = validateModelForm(
			{ name: "Baru", code: "BR", brandId: "1", materialCategoryId: "2" },
			[model()],
			null,
		);
		expect(Object.keys(errors)).toHaveLength(0);
	});
});

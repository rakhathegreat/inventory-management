import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { Kategori } from "@/shared/types/inventory";
import {
	createCategory,
	deleteCategoryById,
	fetchCategories,
	fetchMaterialModels,
	updateCategory,
} from "../api/kategoriApi";

export function useKategoriBarang() {
	const [categories, setCategories] = useState<Kategori[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [deleteAlertData, setDeleteAlertData] = useState<{ isOpen: boolean; id: string; name: string; ids?: string[] }>(
		{ isOpen: false, id: "", name: "" },
	);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	// Form state
	const [name, setName] = useState("");
	const [typeId, setTypeId] = useState<string>("");
	const [materialTypes, setMaterialTypes] = useState<any[]>([]);
	const [nameError, setNameError] = useState("");

	useEffect(() => {
		const savedMode = localStorage.getItem("arxiva_kategori_view_mode") as "grid" | "table" | null;
		if (savedMode) setViewMode(savedMode);
	}, []);

	const handleViewModeChange = (mode: "grid" | "table") => {
		setViewMode(mode);
		localStorage.setItem("arxiva_kategori_view_mode", mode);
	};

	const loadCategories = async () => {
		try {
			setCategories(await fetchCategories());
		} catch (error) {
			console.error("Failed to fetch categories:", error);
			toast.error("Gagal mengambil data kategori dari server.");
		}
	};

	const loadMaterialModels = async () => {
		try {
			setMaterialTypes(await fetchMaterialModels());
		} catch (error) {
			console.error("Failed to fetch material types:", error);
		}
	};

	useEffect(() => {
		loadCategories();
		loadMaterialModels();
	}, []);

	const filteredCategories = useMemo(() => {
		return categories.filter(
			(cat) =>
				cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				cat.description.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [categories, searchQuery]);

	const handleOpenSheet = (id?: string) => {
		if (id) {
			const cat = categories.find((c) => c.id === id) as any;
			if (cat) {
				setName(cat.name);
				setTypeId(cat.typeId || "");
				setEditId(id);
			}
		} else {
			setName("");
			setTypeId("");
			setEditId(null);
		}
		setNameError("");
		setIsSheetOpen(true);
	};

	const handleSave = async () => {
		if (isSaving) return;
		const normalizedName = name.trim();
		if (!normalizedName) {
			setNameError("Nama kategori wajib diisi.");
			toast.error("Nama kategori wajib diisi.");
			return;
		}

		const duplicateCategory = categories.some(
			(category) =>
				category.id !== editId &&
				category.name.trim().toLowerCase() === normalizedName.toLowerCase(),
		);
		if (duplicateCategory) {
			setNameError("Nama kategori sudah terdaftar.");
			toast.error("Kategori dengan nama tersebut sudah terdaftar.");
			return;
		}

		setIsSaving(true);
		try {
			const payload = { nama: normalizedName, typeId: parseInt(typeId) };
			if (editId) await updateCategory(editId, payload);
			else await createCategory(payload);

			await loadCategories();
			setIsSheetOpen(false);
			toast.success(`Berhasil ${editId ? "menyimpan perubahan" : "menambahkan"} data kategori`);
		} catch (error: any) {
			console.error("Failed to save category:", error);
			toast.error(error.message || (typeof error === "string" ? error : "Gagal menyimpan kategori."));
		} finally {
			setIsSaving(false);
		}
	};

	const requestBulkDelete = (items: { id: string; name: string }[]) => {
		if (!items.length) return;
		setDeleteAlertData({ isOpen: true, id: items[0].id, name: items[0].name, ids: items.map((i) => i.id) });
	};

	const requestDelete = (id: string, name: string) => {
		setDeleteAlertData({ isOpen: true, id, name });
	};

	const confirmDelete = async () => {
		if (deleteAlertData.ids && deleteAlertData.ids.length > 1) {
			if (isDeleting) return;
			setIsDeleting(true);
			let ok = 0;
			let fail = 0;
			for (const id of deleteAlertData.ids) {
				try { await deleteCategoryById(id); ok++; } catch { fail++; }
			}
			await loadCategories();
			if (ok) toast.success(`${ok} ${"kategori"} berhasil dihapus`);
			if (fail) toast.error(`${fail} gagal dihapus karena sedang digunakan.`);
			setIsDeleting(false);
			setDeleteAlertData({ isOpen: false, id: "", name: "" });
			return;
		}

		if (isDeleting) return;
		const { id } = deleteAlertData;
		if (!id) return;

		setIsDeleting(true);
		try {
			await deleteCategoryById(id);
			await loadCategories();
			toast.success("Berhasil menghapus kategori");
		} catch (error: any) {
			console.error("Failed to delete category:", error);
			toast.error(error.message || "Gagal menghapus kategori.");
		} finally {
			setIsDeleting(false);
			setDeleteAlertData({ isOpen: false, id: "", name: "" });
		}
	};

	return {
		categories,
		filteredCategories,
		searchQuery,
		setSearchQuery,
		viewMode,
		handleViewModeChange,
		isSheetOpen,
		setIsSheetOpen,
		editId,
		setEditId,
		name,
		setName,
		typeId,
		setTypeId,
		materialTypes,
		nameError,
		setNameError,
		isSaving,
		isDeleting,
		deleteAlertData,
		setDeleteAlertData,
		requestDelete,
		requestBulkDelete,
		confirmDelete,
		handleSave,
		handleOpenSheet,
	};
}

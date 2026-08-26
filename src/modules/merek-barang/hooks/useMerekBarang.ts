import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import type { Merek } from "@/shared/types/inventory";
import {
	createBrand,
	deleteBrandById,
	fetchBrands,
	fetchCategories,
	updateBrand,
} from "../api/merekApi";
import { filterBrands, validateBrandForm } from "../utils/merek";

export function useMerekBarang() {
	const [brands, setBrands] = useState<Merek[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [deleteAlertData, setDeleteAlertData] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: "", name: "" });
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [name, setName] = useState("");
	const [identifier, setIdentifier] = useState("");
	const [origin, setOrigin] = useState("");
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [categories, setCategories] = useState<any[]>([]);
	const [categoryId, setCategoryId] = useState("");

	useEffect(() => {
		const savedMode = localStorage.getItem("arxiva_merek_view_mode") as "grid" | "table" | null;
		if (savedMode) setViewMode(savedMode);
	}, []);

	const handleViewModeChange = (mode: "grid" | "table") => {
		setViewMode(mode);
		localStorage.setItem("arxiva_merek_view_mode", mode);
	};

	const loadCategories = async () => {
		try {
			setCategories(await fetchCategories());
		} catch (error) {
			console.error("Failed to fetch categories:", error);
			toast.error("Gagal mengambil data kategori dari server.");
		}
	};

	const loadBrands = async () => {
		try {
			setBrands(await fetchBrands());
		} catch (error) {
			console.error("Failed to fetch brands:", error);
			toast.error("Gagal mengambil data merek dari server.");
		}
	};

	useEffect(() => {
		loadBrands();
		loadCategories();
	}, []);

	const filteredBrands = useMemo(
		() => filterBrands(brands, searchQuery),
		[brands, searchQuery],
	);

	const handleOpenSheet = (id?: string) => {
		if (id) {
			const brand = brands.find((b) => b.id === id);
			if (brand) {
				setName(brand.nama);
				setIdentifier(brand.identifier);
				setOrigin(brand.origin || "");
				setEditId(id);
			}
		} else {
			setName("");
			setIdentifier("");
			setOrigin("");
			setEditId(null);
		}
		setFormErrors({});
		setIsSheetOpen(true);
	};

	const handleSave = async () => {
		if (isSaving) return;
		const { errors, normalizedIdentifier, trimmedName } = validateBrandForm(
			{ name, identifier },
			brands,
			editId,
		);

		if (Object.keys(errors).length > 0) {
			setFormErrors(errors);
			toast.error("Merek tidak dapat disimpan karena data harus unik.");
			return;
		}

		setIsSaving(true);
		try {
			if (editId) {
				const brand = brands.find((b) => b.id === editId);
				await updateBrand(
					editId,
					{
						nama: trimmedName,
						identifier: normalizedIdentifier,
						origin: origin.trim() || "-",
					},
					brand?.totalItems as number | undefined,
				);
			} else {
				await createBrand({
					nama: trimmedName,
					identifier: normalizedIdentifier,
					origin: origin.trim() || "-",
					categoryId: parseInt(categoryId),
				});
			}
			await loadBrands();
			setIsSheetOpen(false);
			toast.success(`Berhasil ${editId ? "menyimpan perubahan" : "menambahkan"} data merek`);
		} catch (error: any) {
			console.error("Failed to save brand:", error);
			toast.error(error.message || (typeof error === "string" ? error : "Gagal menyimpan merek."));
		} finally {
			setIsSaving(false);
		}
	};

	const requestDelete = (id: string, name: string) => {
		setDeleteAlertData({ isOpen: true, id, name });
	};

	const confirmDelete = async () => {
		if (isDeleting) return;
		const { id } = deleteAlertData;
		if (!id) return;

		setIsDeleting(true);
		try {
			await deleteBrandById(id);
			await loadBrands();
			toast.success("Berhasil menghapus merek");
		} catch (error: any) {
			console.error("Failed to delete brand:", error);
			toast.error(error.message || "Gagal menghapus merek.");
		} finally {
			setIsDeleting(false);
			setDeleteAlertData({ isOpen: false, id: "", name: "" });
		}
	};

	return {
		brands,
		filteredBrands,
		searchQuery,
		setSearchQuery,
		viewMode,
		handleViewModeChange,
		isSheetOpen,
		setIsSheetOpen,
		editId,
		setEditId,
		setFormErrors,
		handleOpenSheet,
		name,
		setName,
		identifier,
		setIdentifier,
		origin,
		setOrigin,
		formErrors,
		categories,
		categoryId,
		setCategoryId,
		isSaving,
		isDeleting,
		deleteAlertData,
		setDeleteAlertData,
		requestDelete,
		confirmDelete,
		handleSave,
	};
}

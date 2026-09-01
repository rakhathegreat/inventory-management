import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
	deleteModelById,
	fetchBrands,
	fetchCategories,
	fetchModels,
	saveModel,
} from "../api/tipeMaterialApi";
import { filterModels, validateModelForm } from "../utils/tipeMaterial";

export function useTipeMaterial() {
	const [types, setTypes] = useState<any[]>([]);
	const [brands, setBrands] = useState<any[]>([]);
	const [categories, setCategories] = useState<any[]>([]);

	const [searchQuery, setSearchQuery] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

	useEffect(() => {
		const savedMode = localStorage.getItem("arxiva_model_view_mode") as "grid" | "table" | null;
		if (savedMode) setViewMode(savedMode);
	}, []);

	const handleViewModeChange = (mode: "grid" | "table") => {
		setViewMode(mode);
		localStorage.setItem("arxiva_model_view_mode", mode);
	};

	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [deleteAlertData, setDeleteAlertData] = useState<{ isOpen: boolean; id: string; name: string; ids?: string[] }>({ isOpen: false, id: "", name: "" });

	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [deskripsi, setDeskripsi] = useState("");
	const [brandId, setBrandId] = useState("");
	const [materialCategoryId, setMaterialCategoryId] = useState("");

	const [nameError, setNameError] = useState("");
	const [brandError, setBrandError] = useState("");
	const [categoryError, setCategoryError] = useState("");

	const loadTypes = async () => {
		try {
			setTypes(await fetchModels());
		} catch (e) {
			toast.error("Gagal mengambil data model material.");
		}
	};

	const loadBrands = async () => setBrands(await fetchBrands());
	const loadCategories = async () => setCategories(await fetchCategories());

	useEffect(() => {
		loadTypes();
		loadBrands();
		loadCategories();
	}, []);

	const filteredTypes = useMemo(
		() => filterModels(types, searchQuery),
		[types, searchQuery],
	);

	const handleOpenSheet = (id?: string) => {
		setNameError("");
		setBrandError("");
		setCategoryError("");

		if (id) {
			const t = types.find((x) => String(x.id) === String(id));
			if (t) {
				setName(t.nama || "");
				setCode(t.code || "");
				setDeskripsi(t.deskripsi || "");
				setBrandId(t.brandId ? String(t.brandId) : "");
				setMaterialCategoryId(t.materialCategoryId ? String(t.materialCategoryId) : "");
				setEditId(id);
			}
		} else {
			setName("");
			setCode("");
			setDeskripsi("");
			setBrandId("");
			setMaterialCategoryId("");
			setEditId(null);
		}
		setIsSheetOpen(true);
	};

	const handleSave = async () => {
		if (isSaving) return;
		const errors = validateModelForm({ name, code, brandId, materialCategoryId }, types, editId);
		setNameError(errors.name || "");
		setBrandError(errors.brand || "");
		setCategoryError(errors.category || "");
		if (Object.keys(errors).length > 0) return;

		setIsSaving(true);
		try {
			await saveModel(editId, {
				nama: name.trim(),
				code: code.trim() || undefined,
				deskripsi: deskripsi.trim() || undefined,
				brandId: parseInt(brandId),
				materialCategoryId: parseInt(materialCategoryId),
			});

			await loadTypes();
			setIsSheetOpen(false);
			toast.success(`Berhasil ${editId ? "memperbarui" : "menambahkan"} model material`);
		} catch (e: any) {
			toast.error(e.message || "Gagal menyimpan model material");
		} finally {
			setIsSaving(false);
		}
	};

	const requestBulkDelete = (items: { id: string; name: string }[]) => {
		if (!items.length) return;
		setDeleteAlertData({ isOpen: true, id: items[0].id, name: items[0].name, ids: items.map((i) => i.id) });
	};

	const confirmDelete = async () => {
		if (deleteAlertData.ids && deleteAlertData.ids.length > 1) {
			if (isDeleting) return;
			setIsDeleting(true);
			let ok = 0;
			let fail = 0;
			for (const id of deleteAlertData.ids) {
				try { await deleteModelById(id); ok++; } catch { fail++; }
			}
			await loadTypes();
			if (ok) toast.success(`${ok} ${"model material"} berhasil dihapus`);
			if (fail) toast.error(`${fail} gagal dihapus karena sedang digunakan.`);
			setIsDeleting(false);
			setDeleteAlertData({ isOpen: false, id: "", name: "" });
			return;
		}

		if (isDeleting || !deleteAlertData.id) return;
		setIsDeleting(true);
		try {
			await deleteModelById(deleteAlertData.id);
			await loadTypes();
			toast.success("Berhasil menghapus model material");
		} catch (e) {
			toast.error("Gagal menghapus model material karena sedang digunakan.");
		} finally {
			setIsDeleting(false);
			setDeleteAlertData({ isOpen: false, id: "", name: "" });
		}
	};

	return {
		types,
		brands,
		categories,
		filteredTypes,
		searchQuery,
		setSearchQuery,
		viewMode,
		handleViewModeChange,
		isSheetOpen,
		setIsSheetOpen,
		editId,
		deleteAlertData,
		setDeleteAlertData,
		isSaving,
		isDeleting,
		name,
		setName,
		code,
		setCode,
		deskripsi,
		setDeskripsi,
		brandId,
		setBrandId,
		materialCategoryId,
		setMaterialCategoryId,
		nameError,
		setNameError,
		brandError,
		setBrandError,
		categoryError,
		setCategoryError,
		handleOpenSheet,
		handleSave,
		requestBulkDelete,
		confirmDelete,
	};
}

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import type {
	BarangUnit,
	StorageLocationOption,
	MaterialModel,
} from "@/shared/types/inventory";
import type { DeleteDialogState } from "@/shared/types/ui";
import { saveExportFile } from "@/shared/lib/export-file";
import {
	ADMIN_LOCATION,
	createItem,
	deleteItemsByIds,
	fetchAuxiliary,
	fetchItems,
	updateItem,
} from "../api/barangApi";
import {
	buildExportFileName,
	mapItemsToExportRows,
	validateBarangForm,
	type BarangFormData,
} from "../utils/barang";

const EMPTY_FORM: BarangFormData = {
	serialNumber: "",
	kategori: "",
	merek: "",
	tipe: "",
	status: "Tersedia",
	kondisi: "Baru",
	lokasiPenyimpanan: "",
};

export function useDataBarang() {
	const [searchParams] = useSearchParams();

	const [barangList, setBarangList] = useState<BarangUnit[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(1);

	const [searchTerm, setSearchTerm] = useState(
		searchParams.get("search") || "",
	);
	const [filterStatus, setFilterStatus] = useState("all");
	const [filterCategory, setFilterCategory] = useState("all");
	const [filterBrand, setFilterBrand] = useState("all");
	const [filterLocation, setFilterLocation] = useState("all");
	const [categories, setCategories] = useState<string[]>([]);
	const [brands, setBrands] = useState<string[]>([]);
	const [models, setModels] = useState<MaterialModel[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const [dbLocations, setDbLocations] = useState<StorageLocationOption[]>([]);

	const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);

	// Drawer detail state
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [detailBarang, setDetailBarang] = useState<BarangUnit | null>(null);

	// Form modal state
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [formMode, setFormMode] = useState<"add" | "edit">("add");
	const [selectedBarang, setSelectedBarang] = useState<BarangUnit | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [formData, setFormData] = useState<BarangFormData>({ ...EMPTY_FORM });

	// Load auxiliary data (Categories & Locations) once
	useEffect(() => {
		fetchAuxiliary()
			.then(({ categories, brands, models, locations }) => {
				setCategories(categories);
				setBrands((prev) =>
					Array.from(new Set([...prev, ...brands])),
				);
				setModels(models);
				setDbLocations(locations);
			})
			.catch((err) => {
				console.error("Gagal memuat kategori/lokasi:", err);
			});
	}, []);

	// Load main paginated items list
	const loadItems = async () => {
		setIsLoading(true);
		try {
			const result = await fetchItems({
				page: currentPage,
				pageSize,
				searchTerm,
				filterStatus,
				filterCategory,
				filterBrand,
				filterLocation,
			});

			if (result && Array.isArray(result.data)) {
				setBarangList(result.data);
				setTotalItems(result.pagination?.totalItems || result.data.length);
				setTotalPages(result.pagination?.totalPages || 1);

				const extractedBrands = Array.from(
					new Set(
						result.data.map((item: BarangUnit) => item.merek).filter(Boolean),
					),
				) as string[];
				if (extractedBrands.length > 0) {
					setBrands((prev) =>
						Array.from(new Set([...prev, ...extractedBrands])),
					);
				}
			} else {
				setBarangList(Array.isArray(result) ? result : []);
				setTotalItems(Array.isArray(result) ? result.length : 0);
				setTotalPages(1);
			}
		} catch (error) {
			console.error("Gagal memuat data:", error);
			toast.error("Gagal memuat data barang");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		loadItems();
	}, [
		currentPage,
		pageSize,
		searchTerm,
		filterStatus,
		filterCategory,
		filterBrand,
		filterLocation,
	]);

	// Reset page to 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [
		searchTerm,
		filterStatus,
		filterCategory,
		filterBrand,
		filterLocation,
		pageSize,
	]);

	const handleOpenDetail = (barang: BarangUnit) => {
		setDetailBarang(barang);
		setIsDetailOpen(true);
	};

	const handleOpenEdit = (barang: BarangUnit) => {
		setFormMode("edit");
		setSelectedBarang(barang);
		setFormData({
			serialNumber: barang.serialNumber,
			kategori: barang.kategori,
			merek: barang.merek,
			tipe: barang.tipe || "",
			status: barang.status,
			kondisi: barang.kondisi || "Baru",
			lokasiPenyimpanan: barang.lokasiPenyimpanan.trim(),
		});
		setFormErrors({});
		setIsFormOpen(true);
	};

	const handleOpenAdd = () => {
		setFormMode("add");
		setFormData({ ...EMPTY_FORM });
		setFormErrors({});
		setIsFormOpen(true);
	};

	const handleExportExcel = async (selectedColumns: string[]) => {
		setIsExporting(true);
		try {
			const dataToExport = barangList;

			if (dataToExport.length === 0) {
				toast.error("Tidak ada data untuk diekspor.");
				setIsExporting(false);
				return;
			}

			const mappedData = mapItemsToExportRows(dataToExport, selectedColumns);

			const worksheet = XLSX.utils.json_to_sheet(mappedData);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, worksheet, "Data Barang");

			const excelBuffer = XLSX.write(workbook, {
				bookType: "xlsx",
				type: "array",
			});
			const fileName = buildExportFileName();

			const res = await saveExportFile({
				fileName,
				contents: excelBuffer,
			});

			if (res.saved) {
				if (res.path) {
					toast.success(`Berhasil mengekspor data ke ${res.path}`);
				} else {
					toast.success("Berhasil mengekspor data.");
				}
				setIsExportModalOpen(false);
			} else {
				toast.error("Gagal mengekspor data.");
			}
		} catch (err) {
			console.error("Export error:", err);
			toast.error("Terjadi kesalahan saat mengekspor data.");
		} finally {
			setIsExporting(false);
		}
	};

	const handleDelete = (id: string, serialNumber: string) => {
		setDeleteDialog({
			type: "single",
			ids: [id],
			serialNumber,
		});
	};

	const confirmDelete = async () => {
		if (!deleteDialog || isDeleting) return;
		const idsToDelete = deleteDialog.ids;
		setIsDeleting(true);

		try {
			await deleteItemsByIds(idsToDelete);
			setDeleteDialog(null);
			toast.success("Unit berhasil dihapus.");
			loadItems();
		} catch (err) {
			toast.error("Gagal menghapus unit.");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleSubmitForm = async (e: React.FormEvent) => {
		e.preventDefault();
		if (isSaving) return;

		const errors = validateBarangForm(formData);
		if (Object.keys(errors).length > 0) {
			setFormErrors(errors);
			toast.error("Gagal menyimpan. Silakan periksa kembali form Anda.");
			return;
		}

		setIsSaving(true);
		try {
			const payload = {
				serialNumber: formData.serialNumber.toUpperCase(),
				kategori: formData.kategori,
				merek: formData.merek,
				tipe: formData.tipe || undefined,
				status: formData.status,
				kondisi: formData.kondisi,
				lokasiPenyimpanan: formData.lokasiPenyimpanan.trim(),
				mitra: ADMIN_LOCATION,
			};

			if (formMode === "add") {
				await createItem(payload);
				toast.success(`Unit baru berhasil didaftarkan!`);
			} else {
				await updateItem(selectedBarang!.id, payload);
				toast.success(`Unit berhasil diperbarui!`);
			}

			setIsFormOpen(false);
			loadItems();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan unit.");
		} finally {
			setIsSaving(false);
		}
	};

	const isFiltered =
		searchTerm.trim().length > 0 ||
		filterStatus !== "all" ||
		filterCategory !== "all" ||
		filterBrand !== "all" ||
		filterLocation !== "all";

	return {
		barangList,
		isLoading,
		totalItems,
		totalPages,
		currentPage,
		setCurrentPage,
		pageSize,
		setPageSize,
		searchTerm,
		setSearchTerm,
		filterStatus,
		setFilterStatus,
		filterCategory,
		setFilterCategory,
		filterBrand,
		setFilterBrand,
		filterLocation,
		setFilterLocation,
		categories,
		brands,
		models,
		dbLocations,
		isDetailOpen,
		setIsDetailOpen,
		detailBarang,
		isFormOpen,
		setIsFormOpen,
		isExportModalOpen,
		setIsExportModalOpen,
		isExporting,
		formMode,
		formData,
		setFormData,
		formErrors,
		isSaving,
		isDeleting,
		deleteDialog,
		setDeleteDialog,
		isFiltered,
		handleOpenDetail,
		handleOpenEdit,
		handleOpenAdd,
		handleExportExcel,
		handleDelete,
		confirmDelete,
		handleSubmitForm,
	};
}

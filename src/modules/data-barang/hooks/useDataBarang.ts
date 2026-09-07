import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import type { BarangUnit } from "@/shared/types/inventory";
import type { DeleteDialogState } from "@/shared/types/ui";
import { saveExportFile } from "@/shared/lib/export-file";
import {
	ADMIN_LOCATION,
	createItem,
	deleteItemsByIds,
	fetchItems,
	updateItem,
} from "../api/barangApi";
import {
	buildExportFileName,
	mapItemsToExportRows,
	validateBarangForm,
	type BarangFormData,
} from "../utils/barang";

function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delayMs);
		return () => clearTimeout(id);
	}, [value, delayMs]);
	return debounced;
}

const EMPTY_FORM: BarangFormData = {
	serialNumber: "",
	kategori: "",
	merek: "",
	tipe: "",
	status: "Tersedia",
	kondisi: "Baru",
	lokasiPenyimpanan: "",
	ticket: "",
	catatan: "",
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
	const debouncedSearch = useDebouncedValue(searchTerm, 300);
	const [filterStatus, setFilterStatus] = useState("Terdistribusi");
	const [filterCategory, setFilterCategory] = useState("all");
	const [filterBrand, setFilterBrand] = useState("all");
	const [filterLocation, setFilterLocation] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const prevFiltersRef = useRef({
		status: filterStatus,
		category: filterCategory,
		brand: filterBrand,
		location: filterLocation,
		pageSize,
		search: debouncedSearch,
	});
	const lastRequestRef = useRef<{
		page: number;
		size: number;
		search: string;
		status: string;
		category: string;
		brand: string;
		location: string;
	} | null>(null);
	const fetchSeqRef = useRef(0);

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

	// Load main paginated items list
	const loadItems = async (
		page: number,
		size: number,
		search: string,
		status: string,
		category: string,
		brand: string,
		location: string,
	) => {
		const seq = ++fetchSeqRef.current;
		setIsLoading(true);
		try {
			const result = await fetchItems({
				page,
				pageSize: size,
				searchTerm: search,
				filterStatus: status,
				filterCategory: category,
				filterBrand: brand,
				filterLocation: location,
			});

			// Abaikan respons basi (out-of-order) jika ada permintaan baru.
			if (seq !== fetchSeqRef.current) return;

			if (result && Array.isArray(result.data)) {
				setBarangList(result.data);
				setTotalItems(result.pagination?.totalItems || result.data.length);
				setTotalPages(result.pagination?.totalPages || 1);
			} else {
				setBarangList(Array.isArray(result) ? result : []);
				setTotalItems(Array.isArray(result) ? result.length : 0);
				setTotalPages(1);
			}
		} catch (error) {
			console.error("Gagal memuat data:", error);
			toast.error("Gagal memuat data barang");
		} finally {
			if (seq === fetchSeqRef.current) setIsLoading(false);
		}
	};

	// Single effect: reset page ke 1 saat filter berubah, lalu fetch sekali.
	// Guard lastRequestRef mencegah fetch ganda akibat reset currentPage.
	useEffect(() => {
		const prev = prevFiltersRef.current;
		const filtersChanged =
			prev.status !== filterStatus ||
			prev.category !== filterCategory ||
			prev.brand !== filterBrand ||
			prev.location !== filterLocation ||
			prev.pageSize !== pageSize ||
			prev.search !== debouncedSearch;

		if (filtersChanged) {
			prevFiltersRef.current = {
				status: filterStatus,
				category: filterCategory,
				brand: filterBrand,
				location: filterLocation,
				pageSize,
				search: debouncedSearch,
			};
		}

		const targetPage = filtersChanged ? 1 : currentPage;
		const request = {
			page: targetPage,
			size: pageSize,
			search: debouncedSearch,
			status: filterStatus,
			category: filterCategory,
			brand: filterBrand,
			location: filterLocation,
		};

		// Fetch ganda yang identik (mis. reset page memicu re-render) → skip.
		if (
			lastRequestRef.current &&
			lastRequestRef.current.page === request.page &&
			lastRequestRef.current.size === request.size &&
			lastRequestRef.current.search === request.search &&
			lastRequestRef.current.status === request.status &&
			lastRequestRef.current.category === request.category &&
			lastRequestRef.current.brand === request.brand &&
			lastRequestRef.current.location === request.location
		) {
			if (filtersChanged && currentPage !== 1) setCurrentPage(1);
			return;
		}

		lastRequestRef.current = request;
		if (filtersChanged && currentPage !== 1) setCurrentPage(1);
		loadItems(
			targetPage,
			request.size,
			request.search,
			request.status,
			request.category,
			request.brand,
			request.location,
		);
	}, [
		currentPage,
		pageSize,
		debouncedSearch,
		filterStatus,
		filterCategory,
		filterBrand,
		filterLocation,
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
			ticket: barang.ticket || "",
			catatan: barang.catatan || "",
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
			const exportPageSize = 1000;
			let exportPage = 1;
			let exportTotalPages = 1;
			const allItems: BarangUnit[] = [];

			while (exportPage <= exportTotalPages) {
				const result = await fetchItems({
					page: exportPage,
					pageSize: exportPageSize,
					searchTerm: debouncedSearch,
					filterStatus,
					filterCategory,
					filterBrand,
					filterLocation,
				});

				if (!result || !Array.isArray(result.data) || result.data.length === 0)
					break;

				allItems.push(...result.data);
				exportTotalPages = result.pagination?.totalPages || 1;
				exportPage += 1;
			}

			const dataToExport = allItems;

			if (dataToExport.length === 0) {
				toast.error("Tidak ada data untuk diekspor.");
				return;
			}

			toast.info(`Mengumpulkan ${dataToExport.length} unit untuk diekspor...`);

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
					toast.success(
						`Berhasil mengekspor ${dataToExport.length} unit ke ${res.path}`,
					);
				} else {
					toast.success(`Berhasil mengekspor ${dataToExport.length} unit.`);
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

	const handleBulkDelete = (ids: string[]) => {
		if (!ids.length) return;
		setDeleteDialog({ type: "bulk", ids });
	};

	const confirmDelete = async () => {
		if (!deleteDialog || isDeleting) return;
		const idsToDelete = deleteDialog.ids;
		setIsDeleting(true);

		try {
			await deleteItemsByIds(idsToDelete);
			setDeleteDialog(null);
			toast.success("Unit berhasil dihapus.");
			loadItems(currentPage, pageSize, debouncedSearch, filterStatus, filterCategory, filterBrand, filterLocation);
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
				ticket:
					formData.kondisi === "Rusak" ? formData.ticket?.trim() || null : null,
				catatan:
					formData.kondisi === "Rusak"
						? formData.catatan?.trim() || null
						: null,
			};

			if (formMode === "add") {
				await createItem(payload);
				toast.success(`Unit baru berhasil didaftarkan!`);
			} else {
				await updateItem(selectedBarang!.id, payload);
				toast.success(`Unit berhasil diperbarui!`);
			}

			setIsFormOpen(false);
			loadItems(currentPage, pageSize, debouncedSearch, filterStatus, filterCategory, filterBrand, filterLocation);
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
		handleBulkDelete,
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

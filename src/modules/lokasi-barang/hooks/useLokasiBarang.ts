import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { StorageLocation } from "@/shared/types/inventory";
import type { SheetMode } from "@/shared/types/ui";
import {
	fetchLocations,
	fetchBrandNames,
	createRak,
	createKardus,
	createPallet,
	createLevel,
	updateRakName,
	updateStorageUnit,
	updateLevel,
	toggleActive,
	deleteLocation,
} from "../api/lokasiApi";
import {
	computeStats,
	sortAndFilterLocations,
	getNextShelfName,
	getNextLevelShelfName,
	isKpStorageLocation,
} from "../utils/lokasi";

export function useLokasiBarang() {
	const [locations, setLocations] = useState<StorageLocation[]>([]);
	const [brands, setBrands] = useState<string[]>(["Campuran"]);
	const [sheetMode, setSheetMode] = useState<SheetMode>("closed");
	const [activeItem, setActiveItem] = useState<{ parentId?: string; levelId?: string } | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<"all" | "rak" | "kardus" | "pallet">("all");
	const [sortBy, setSortBy] = useState<"util-desc" | "util-asc" | "name">("name");

	// Form states
	const [locName, setLocName] = useState("");
	const [locCapacity, setLocCapacity] = useState("1");
	const [locBrand, setLocBrand] = useState("Campuran");
	const [locLevelsCount, setLocLevelsCount] = useState("3");
	const [deleteAlertData, setDeleteAlertData] = useState<{
		isOpen: boolean;
		type: "location" | "level" | null;
		id: string;
		name: string;
	}>({ isOpen: false, type: null, id: "", name: "" });

	const [isSaving, setIsSaving] = useState(false);
	const [isToggling, setIsToggling] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const loadLocations = async () => {
		try {
			setLocations((await fetchLocations()).filter(isKpStorageLocation));
		} catch {
			toast.error("Gagal mengambil data lokasi dari server.");
		}
	};

	const loadBrands = async () => {
		setBrands(await fetchBrandNames());
	};

	useEffect(() => {
		loadLocations();
		loadBrands();
	}, []);

	const stats = useMemo(() => computeStats(locations), [locations]);

	const filteredAndSortedLocations = useMemo(
		() => sortAndFilterLocations(locations, { searchQuery, filterType, sortBy }),
		[locations, searchQuery, filterType, sortBy]
	);

	const handleOpenSheet = (mode: SheetMode, item?: { parentId?: string; levelId?: string }) => {
		setSheetMode(mode);
		setActiveItem(item || null);

		setLocName(mode === "add-rak" ? getNextShelfName(locations) : "");
		setLocCapacity("1");
		setLocBrand("Campuran");
		setLocLevelsCount("3");

		if (item && item.parentId) {
			const loc = locations.find((l) => l.id === item.parentId);
			if (loc) {
				if (mode === "edit-rak" || mode === "edit-kardus" || mode === "edit-pallet") {
					setLocName(loc.name);
					if (loc.type === "Kardus" || loc.type === "Pallet") {
						setLocCapacity(loc.capacity?.toString() || "0");
						setLocBrand(loc.brandRule || "Campuran");
					}
				} else if (mode === "edit-level" && item.levelId) {
					const lvl = loc.levels?.find((l) => l.id === item.levelId);
					if (lvl) {
						setLocCapacity(lvl.capacity.toString());
						setLocBrand(lvl.brandRule || "Campuran");
					}
				}
			}
		}
	};

	const handleSave = async () => {
		if (isSaving) return;
		setIsSaving(true);
		try {
			switch (sheetMode) {
				case "add-rak":
					await createRak(locName || getNextShelfName(locations), parseInt(locLevelsCount) || 1);
					break;
				case "add-kardus":
					await createKardus(locName || "Kardus Baru", parseInt(locCapacity) || 0, locBrand);
					break;
				case "add-pallet":
					await createPallet(locName || "Pallet Baru", parseInt(locCapacity) || 0, locBrand);
					break;
				case "edit-rak":
					await updateRakName(activeItem!.parentId!, locName);
					break;
				case "edit-kardus":
					await updateStorageUnit(
						activeItem!.parentId!,
						{ name: locName, capacity: parseInt(locCapacity) || 0, brandRule: locBrand },
						"kardus"
					);
					break;
				case "edit-pallet":
					await updateStorageUnit(
						activeItem!.parentId!,
						{ name: locName, capacity: parseInt(locCapacity) || 0, brandRule: locBrand },
						"pallet"
					);
					break;
				case "add-level":
					await createLevel(
						activeItem!.parentId!,
						getNextLevelShelfName(locations, activeItem!.parentId),
						parseInt(locCapacity) || 0,
						locBrand
					);
					break;
				case "edit-level":
					await updateLevel(activeItem!.levelId!, parseInt(locCapacity) || 0, locBrand);
					break;
			}
			await loadLocations();
			toast.success(sheetMode?.startsWith("add-") ? "Berhasil menambahkan lokasi baru" : "Berhasil menyimpan perubahan");
			setSheetMode("closed");
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan data lokasi.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleToggleLocation = async (id: string) => {
		if (isToggling) return;
		setIsToggling(true);
		try {
			const loc = locations.find((l) => l.id === id);
			if (loc) {
				await toggleActive(id, !loc.isActive);
				await loadLocations();
				toast.success(`Berhasil ${!loc.isActive ? "mengaktifkan" : "menonaktifkan"} lokasi`);
			}
		} catch {
			toast.error("Gagal mengubah status lokasi");
		} finally {
			setIsToggling(false);
		}
	};

	const handleToggleLevel = async (rakId: string, levelId: string) => {
		if (isToggling) return;
		setIsToggling(true);
		try {
			const loc = locations.find((l) => l.id === rakId);
			const lvl = loc?.levels?.find((l) => l.id === levelId);
			if (lvl) {
				await toggleActive(levelId, !lvl.isActive);
				await loadLocations();
				toast.success(`Berhasil ${!lvl.isActive ? "mengaktifkan" : "menonaktifkan"} level`);
			}
		} catch {
			toast.error("Gagal mengubah status level");
		} finally {
			setIsToggling(false);
		}
	};

	const requestDeleteLocation = (id: string, name: string) =>
		setDeleteAlertData({ isOpen: true, type: "location", id, name });
	const requestDeleteLevel = (levelId: string, name: string) =>
		setDeleteAlertData({ isOpen: true, type: "level", id: levelId, name });

	const confirmDelete = async (e: React.MouseEvent) => {
		e.preventDefault();
		if (isDeleting) return;
		const { type, id } = deleteAlertData;
		if (!type || !id) return;
		setIsDeleting(true);
		try {
			await deleteLocation(id);
			await loadLocations();
			toast.success(`Berhasil menghapus ${type === "location" ? "lokasi" : "level"}`);
			setDeleteAlertData({ isOpen: false, type: null, id: "", name: "" });
		} catch {
			toast.error("Gagal menghapus data");
		} finally {
			setIsDeleting(false);
		}
	};

	return {
		// data & derived
		locations,
		stats,
		filteredAndSortedLocations,
		// filter
		searchQuery,
		setSearchQuery,
		filterType,
		setFilterType,
		sortBy,
		setSortBy,
		// sheet form
		sheetMode,
		setSheetMode,
		handleOpenSheet,
		brands,
		locName,
		setLocName,
		locCapacity,
		setLocCapacity,
		locBrand,
		setLocBrand,
		locLevelsCount,
		setLocLevelsCount,
		isSaving,
		handleSave,
		// actions
		isToggling,
		handleToggleLocation,
		handleToggleLevel,
		deleteAlertData,
		setDeleteAlertData,
		requestDeleteLocation,
		requestDeleteLevel,
		confirmDelete,
		isDeleting,
		loadLocations,
	};
}

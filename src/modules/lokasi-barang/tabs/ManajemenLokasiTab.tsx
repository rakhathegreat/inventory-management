import * as React from "react";
import { Loader2, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { cn } from "@/shared/lib/utils";
import { useLokasiBarang } from "../hooks/useLokasiBarang";
import { downloadQrCode as onDownloadQr } from "../utils/downloadQr";
import { LokasiCard, type LokasiCardActions } from "../components/LokasiCard";
import { getTypeConfig } from "../components/type-config";
import { LokasiSheet } from "../components/LokasiSheet";

const FILTERS = [
	{ key: "all", label: "Semua" },
	{ key: "rak", label: "Rak" },
	{ key: "kardus", label: "Kardus" },
	{ key: "pallet", label: "Pallet" },
] as const;

const SORT_OPTIONS = [
	{ value: "name", label: "Nama (A-Z)" },
	{ value: "util-desc", label: "Terisi tertinggi" },
	{ value: "util-asc", label: "Terisi terendah" },
] as const;

const ADD_MODES = { Rak: "add-rak", Kardus: "add-kardus", Pallet: "add-pallet" } as const;

const SHEET_TITLES: Record<string, string> = {
	"add-rak": "Tambah Rak Baru",
	"edit-rak": "Edit Rak",
	"add-kardus": "Tambah Kardus Baru",
	"edit-kardus": "Edit Kardus",
	"add-pallet": "Tambah Pallet Baru",
	"edit-pallet": "Edit Pallet",
	"add-level": "Tambah Level Rak",
	"edit-level": "Edit Level Rak",
	closed: "",
};

/** Tab pengelolaan lokasi: rak, kardus, dan pallet. */
export default function ManajemenLokasiTab() {
	const navigate = useNavigate();
	const {
		filteredAndSortedLocations,
		searchQuery,
		setSearchQuery,
		filterType,
		setFilterType,
		sortBy,
		setSortBy,
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
		isToggling,
		handleToggleLocation,
		handleToggleLevel,
		deleteAlertData,
		setDeleteAlertData,
		requestDeleteLocation,
		requestDeleteLevel,
		confirmDelete,
		isDeleting,
	} = useLokasiBarang();

	const cardActions = React.useMemo<LokasiCardActions>(
		() => ({
			onOpenSheet: handleOpenSheet,
			onToggleLocation: handleToggleLocation,
			onToggleLevel: handleToggleLevel,
			onDeleteLocation: requestDeleteLocation,
			onDeleteLevel: requestDeleteLevel,
			onDownloadQr,
			onViewItems: (query) => navigate(`/data-barang?search=${encodeURIComponent(query)}`),
		}),
		[handleOpenSheet, handleToggleLocation, handleToggleLevel, requestDeleteLocation, requestDeleteLevel, navigate],
	);

	const hasActiveFilter = searchQuery !== "" || filterType !== "all";

	return (
		<div className="flex flex-col gap-4 pb-10">
			<div className="flex justify-end">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" className="h-9 cursor-pointer gap-2">
							<Plus className="size-4" /> Tambah Lokasi
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-44 text-xs">
						<DropdownMenuGroup>
							{(Object.keys(ADD_MODES) as (keyof typeof ADD_MODES)[]).map((type) => {
								const config = getTypeConfig(type);
								const Icon = config.icon;
								return (
									<DropdownMenuItem
										key={type}
										className="cursor-pointer text-xs"
										onClick={() => handleOpenSheet(ADD_MODES[type])}>
										<Icon className={config.text} /> Tambah {type}
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					</DropdownMenuContent>
			</DropdownMenu>
			</div>

			<div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="relative w-full lg:w-80">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Cari nama lokasi atau aturan merek..."
						className="pl-9 text-xs"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<div role="group" aria-label="Filter tipe penyimpanan" className="flex flex-wrap items-center gap-1 rounded-lg border p-1">
						{FILTERS.map(({ key, label }) => (
							<button
								key={key}
								type="button"
								aria-pressed={filterType === key}
								onClick={() => setFilterType(key)}
								className={cn(
									"cursor-pointer rounded-md px-3 py-1 text-xs transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
									filterType === key
										? "bg-primary/10 font-semibold text-foreground"
										: "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
								)}>
								{label}
							</button>
						))}
					</div>

					<span className="hidden h-6 w-px bg-border lg:block" />

					<div className="flex items-center gap-2">
						<SlidersHorizontal className="size-3.5 shrink-0 text-muted-foreground" />
						<Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
							<SelectTrigger className="w-40 cursor-pointer text-xs">
								<SelectValue placeholder="Urutkan..." />
							</SelectTrigger>
							<SelectContent className="text-xs">
								{SORT_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value} className="cursor-pointer text-xs">
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{filteredAndSortedLocations.length > 0 ? (
				<div className="grid gap-4 pb-10 md:grid-cols-2 xl:grid-cols-3">
					{filteredAndSortedLocations.map((loc) => (
						<LokasiCard key={loc.id} loc={loc} isToggling={isToggling} isDeleting={isDeleting} {...cardActions} />
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-20 text-center">
					<div className="mb-2 flex size-14 items-center justify-center rounded-xl bg-muted">
						<Search className="size-6 text-muted-foreground" />
					</div>
					<h2 className="text-base font-semibold text-foreground">Tidak ada lokasi yang cocok</h2>
					<p className="max-w-sm text-xs text-muted-foreground">
						Tidak ditemukan lokasi penyimpanan sesuai kata kunci atau filter tipe saat ini.
					</p>
					{hasActiveFilter ? (
						<Button
							variant="outline"
							size="sm"
							className="mt-2 cursor-pointer text-xs"
							onClick={() => {
								setSearchQuery("");
								setFilterType("all");
							}}>
							Bersihkan filter
						</Button>
					) : (
						<Button size="sm" className="mt-2 cursor-pointer gap-2 text-xs" onClick={() => handleOpenSheet("add-rak")}>
							<Plus className="size-3.5" /> Tambah Lokasi
						</Button>
					)}
				</div>
			)}

			<Sheet open={sheetMode !== "closed"} onOpenChange={(open) => !open && setSheetMode("closed")}>
				<SheetContent className="flex flex-col sm:max-w-md">
					<SheetHeader>
						<SheetTitle>{SHEET_TITLES[sheetMode]}</SheetTitle>
						<SheetDescription className="text-xs">
							Lengkapi detail lokasi penyimpanan di bawah ini.
						</SheetDescription>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto p-6 pt-0">
						<div className="grid gap-5">
							<LokasiSheet
								mode={sheetMode}
								brands={brands}
								locName={locName}
								setLocName={setLocName}
								locCapacity={locCapacity}
								setLocCapacity={setLocCapacity}
								locBrand={locBrand}
								setLocBrand={setLocBrand}
								locLevelsCount={locLevelsCount}
								setLocLevelsCount={setLocLevelsCount}
							/>
						</div>
					</div>
					<SheetFooter className="gap-2">
						<Button variant="outline" onClick={() => setSheetMode("closed")} disabled={isSaving} className="cursor-pointer text-xs">
							Batal
						</Button>
						<Button onClick={handleSave} disabled={isSaving} className="cursor-pointer text-xs">
							{isSaving ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" /> Menyimpan...
								</>
							) : (
								"Simpan Perubahan"
							)}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<AlertDialog
				open={deleteAlertData.isOpen}
				onOpenChange={(open) => !open && setDeleteAlertData({ ...deleteAlertData, isOpen: false })}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base">
							Hapus {deleteAlertData.type === "location" ? "lokasi" : "level"}?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
							<strong>{deleteAlertData.name}</strong> beserta seluruh data terkait akan dihapus permanen.
							Tindakan ini tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel disabled={isDeleting} className="cursor-pointer text-xs">
							Batal
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => confirmDelete(e)}
							disabled={isDeleting}
							className="cursor-pointer bg-destructive text-xs text-white hover:bg-destructive/90">
							{isDeleting ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" /> Menghapus...
								</>
							) : (
								"Hapus Data"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

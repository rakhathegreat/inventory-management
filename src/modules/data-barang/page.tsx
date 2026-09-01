"use client";

import * as React from "react";
import {
	Plus,
	Search,
	Edit,
	Trash2,
	Boxes,
	Loader2,
	Download,
	ExternalLink,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Badge } from "@/shared/ui/badge";
import { DataTable, createRowActionsColumn } from "@/shared/ui/data-table/DataTable";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { BarangDetailDrawer } from "@/modules/data-barang/components/BarangDetailDrawer";
import { BarangFormModal } from "@/modules/data-barang/components/BarangFormModal";
import { ExportExcelModal } from "@/modules/data-barang/components/ExportExcelModal";
import { formatItemLocation } from "@/shared/lib/status-helper";

import { useDataBarang } from "./hooks/useDataBarang";
import { STATUS_OPTIONS, formatTanggal, isReconTelat } from "./utils/barang";
import { ADMIN_LOCATION, getBaseUrl, getHeaders } from "./api/barangApi";
import type { BarangUnit } from "@/shared/types/inventory";

export default function DataBarangPage() {
	const {
		barangList,
		isLoading,
		totalItems,
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
		handleExportExcel,
		handleDelete,
		handleBulkDelete,
		confirmDelete,
		handleSubmitForm,
	} = useDataBarang();
	const navigate = useNavigate();

	const columns = React.useMemo<ColumnDef<BarangUnit, any>[]>(
		() => [
			{
				id: "nomor",
				header: () => <span>No.</span>,
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{(currentPage - 1) * pageSize + row.index + 1}
					</span>
				),
			},
			{
				accessorKey: "serialNumber",
				header: "Serial Number (SN)",
			},
			{
				accessorKey: "merek",
				header: "Merek",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.merek || "-"}</span>
				),
			},
			{
				accessorKey: "kategori",
				header: "Kategori",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.kategori || "-"}</span>
				),
			},
			{
				accessorKey: "kondisi",
				header: () => <span className="flex justify-center">Kondisi</span>,
				meta: { className: "text-center" },
				cell: ({ row }) => (
					<div className="flex justify-center">
						<StatusBadge size="sm" status={row.original.kondisi || "Baru"} />
					</div>
				),
			},
			{
				accessorKey: "status",
				header: () => <span className="flex justify-center">Status</span>,
				meta: { className: "text-center" },
				cell: ({ row }) => (
					<div className="flex justify-center">
						<StatusBadge size="sm" status={row.original.status} />
					</div>
				),
			},
			{
				accessorKey: "lokasiPenyimpanan",
				header: () => <span className="flex justify-center">Lokasi Penyimpanan</span>,
				meta: { className: "text-center text-muted-foreground" },
				cell: ({ row }) => (
					<span>
						{formatItemLocation(row.original.lokasiPenyimpanan, row.original.mitra)}
					</span>
				),
			},
			...(filterStatus === "Terdistribusi"
				? [
						{
							id: "lastReconDate",
							header: () => (
								<span className="flex justify-center">Rekon Terakhir</span>
							),
							meta: { className: "text-center" },
							cell: ({ row }: { row: any }) => {
								const item: BarangUnit = row.original;
								const telat = isReconTelat(item);
								return (
									<div className="flex flex-col items-center gap-1">
										<span
											className={
												item.lastReconDate
													? ""
													: "text-muted-foreground"
											}>
											{item.lastReconDate
												? formatTanggal(item.lastReconDate)
												: "-"}
										</span>
										{item.lastPhotoUrl ? (
											<a
												href={item.lastPhotoUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-[11px] text-primary underline underline-offset-4 hover:text-primary/80">
												<ExternalLink className="size-3" />
												Lihat Foto
											</a>
										) : null}
										{telat && (
											<Badge
												variant="destructive"
												className="gap-1 px-1.5 py-0 text-[10px] font-medium">
												Telat
											</Badge>
										)}
									</div>
								);
							},
						},
					]
				: []),
			createRowActionsColumn<BarangUnit>((item) => [
				{ label: "Edit Material", icon: Edit, onClick: () => handleOpenEdit(item) },
				{
					label: "Hapus Material",
					icon: Trash2,
					destructive: true,
					onClick: () => handleDelete(item.id, item.serialNumber),
				},
			]),
		],
		[currentPage, pageSize, handleOpenEdit, handleDelete, filterStatus],
	);

	return (
		<div className="p-6 h-full flex flex-col gap-6 text-neutral-100 mx-auto w-full">
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full lg:w-auto">
					<div className="relative w-full sm:w-72">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
						<Input
							type="search"
							placeholder="Cari SN atau material..."
							className="w-full pl-9 bg-card border-border focus-visible:ring-1 focus-visible:ring-neutral-700 placeholder:text-sm"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<Select value={filterCategory} onValueChange={setFilterCategory}>
							<SelectTrigger
								className={`w-32 rounded-sm bg-card border-border text-foreground ${filterCategory === "all" ? "border-dashed text-muted-foreground" : ""}`}>
								<SelectValue placeholder="Kategori" />
							</SelectTrigger>
							<SelectContent className="bg-card border-border text-foreground">
								<SelectItem value="all">Kategori</SelectItem>
								{categories.map((c) => (
									<SelectItem key={c} value={c}>
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={filterBrand} onValueChange={setFilterBrand}>
							<SelectTrigger
								className={`w-32 rounded-sm bg-card border-border text-foreground ${filterBrand === "all" ? "border-dashed text-muted-foreground" : ""}`}>
								<SelectValue placeholder="Merek" />
							</SelectTrigger>
							<SelectContent className="bg-card border-border text-foreground">
								<SelectItem value="all">Merek</SelectItem>
								{brands.map((b) => (
									<SelectItem key={b} value={b}>
										{b}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={filterLocation} onValueChange={setFilterLocation}>
							<SelectTrigger
								className={`w-40 rounded-sm bg-card border-border text-foreground ${filterLocation === "all" ? "border-dashed text-muted-foreground" : ""}`}>
								<SelectValue placeholder="Shelf" />
							</SelectTrigger>
							<SelectContent className="bg-card border-border text-foreground">
								<SelectItem value="all">Shelf</SelectItem>
								{dbLocations.map((loc) => (
									<SelectItem key={loc.name} value={loc.name}>
										{loc.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="flex justify-end gap-2 w-full lg:w-auto">
					{(
						<>
							<Button
								variant="outline"
								className="h-8 gap-2 rounded-sm bg-card border-border text-foreground cursor-pointer"
								onClick={() => setIsExportModalOpen(true)}>
								<Download className="w-4 h-4" /> Export Excel
							</Button>
							<Button
								className="h-8 gap-2 rounded-sm cursor-pointer"
								onClick={() => navigate("/barang-masuk")}>
								<Plus className="w-4 h-4" /> Tambah Material
							</Button>
						</>
					)}
				</div>
			</div>

			<Tabs
				value={filterStatus}
				onValueChange={setFilterStatus}
				className="w-full">
				<TabsList variant="line" className="w-fit">
					{STATUS_OPTIONS.map((status) => (
						<TabsTrigger key={status} value={status}>
							{status}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			<DataTable<BarangUnit>
				data={barangList}
				enableSelection
				getRowId={(row) => row.id}
				bulkActions={[
					{
						label: "Hapus terpilih",
						icon: Trash2,
						destructive: true,
						onAction: handleBulkDelete,
					},
				]}
				columns={columns}
				isLoading={isLoading}
				onRowClick={handleOpenDetail}
				pagination="server"
				totalItems={totalItems}
				page={currentPage}
				onPageChange={setCurrentPage}
				pageSize={pageSize}
				onPageSizeChange={setPageSize}
				className="flex flex-col gap-4 w-full min-h-0"
				emptyState={{
					icon: Boxes,
					title: isFiltered ? "Tidak ada unit yang cocok" : "Belum ada data material",
					description: isFiltered
						? undefined
						: "Daftarkan unit material pertama ke dalam inventaris.",
					action:
						!isFiltered ? (
							<Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => navigate("/barang-masuk")}>
								<Plus className="size-4" /> Tambah Material
							</Button>
						) : undefined,
				}}
			/>

			<BarangDetailDrawer
				isOpen={isDetailOpen}
				onOpenChange={setIsDetailOpen}
				detailBarang={detailBarang}
				userRole={"admin"}
				onOpenEdit={handleOpenEdit}
				formatTanggal={formatTanggal}
				ADMIN_LOCATION={ADMIN_LOCATION}
				getBaseUrl={getBaseUrl}
				getHeaders={getHeaders}
			/>

			<BarangFormModal
				isOpen={isFormOpen}
				onOpenChange={setIsFormOpen}
				formMode={formMode}
				formData={formData}
				setFormData={setFormData}
				formErrors={formErrors}
				isSaving={isSaving}
				onSubmit={handleSubmitForm}
				categories={categories}
				brands={brands}
				models={models}
				availableFormLocations={dbLocations}
				STATUS_OPTIONS={STATUS_OPTIONS}
			/>

			<ExportExcelModal
				isOpen={isExportModalOpen}
				onOpenChange={setIsExportModalOpen}
				onExport={handleExportExcel}
				isExporting={isExporting}
			/>

			<AlertDialog
				open={!!deleteDialog}
				onOpenChange={(open) => !open && setDeleteDialog(null)}>
				<AlertDialogContent className="max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base text-destructive">
							{deleteDialog?.type === "single"
								? `Hapus Unit ${deleteDialog.serialNumber}`
								: `Hapus ${deleteDialog?.ids.length} Unit Terpilih?`}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-sm">
							Tindakan ini tidak dapat dibatalkan. Unit material yang dihapus
							akan terhapus dari sistem inventaris.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="pt-2">
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={isDeleting}
							variant="destructive">
							{isDeleting ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								"Ya, Hapus Data"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

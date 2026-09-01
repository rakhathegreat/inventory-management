"use client";

import * as React from "react";
import {
	Plus,
	Edit,
	Trash2,
	Search,
	MoreVertical,
	Loader2,
	LayoutGrid,
	List,
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from "@/shared/ui/sheet";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
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
	DataTable,
	createRowActionsColumn,
} from "@/shared/ui/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import type { ModelRow } from "./utils/tipeMaterial";
import { useTipeMaterial } from "./hooks/useTipeMaterial";

export default function TipeMaterialPage() {
	const {
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
		confirmDelete,
		requestBulkDelete,
	} = useTipeMaterial();

	const columns = React.useMemo<ColumnDef<ModelRow, any>[]>(
		() => [
			{
				id: "nomor",
				header: "No.",
				cell: ({ row, table }) => {
					const { pageIndex, pageSize } = table.getState().pagination;
					return (
						<span className="text-muted-foreground">
							{pageIndex * pageSize + row.index + 1}
						</span>
					);
				},
			},
			{
				accessorKey: "code",
				header: "Kode Model",
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{row.original.code || "-"}
					</span>
				),
			},
			{
				accessorKey: "nama",
				header: "Nama Model",
				cell: ({ row }) => (
					<span className="text-foreground">{row.original.nama}</span>
				),
			},
			{
				id: "deskripsi",
				header: "Deskripsi",
				cell: ({ row }) => (
					<span
						className="block max-w-48 truncate text-muted-foreground"
						title={row.original.deskripsi || undefined}>
						{row.original.deskripsi || "-"}
					</span>
				),
			},
			{
				id: "merek",
				header: "Merek",
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{row.original.brand?.nama || "-"}
					</span>
				),
			},
			{
				id: "kategori",
				header: "Kategori",
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{row.original.materialCategory?.nama || "-"}
					</span>
				),
			},
			{
				id: "totalUnit",
				header: () => <span>Total Unit</span>,
				cell: ({ row }) => (
					<span className="text-foreground font-medium">
						{row.original.totalItems ?? row.original._count?.items ?? 0} Unit
					</span>
				),
			},
			createRowActionsColumn<ModelRow>([
				{
					label: "Edit Model Material",
					icon: Edit,
					onClick: (t) => handleOpenSheet(String(t.id)),
				},
				{
					label: "Hapus Model Material",
					icon: Trash2,
					destructive: true,
					onClick: (t) =>
						setDeleteAlertData({
							isOpen: true,
							id: String(t.id),
							name: t.nama,
						}),
				},
			]),
		],
		[handleOpenSheet, setDeleteAlertData],
	);

	return (
		<div className="p-6 h-full flex flex-col gap-6 text-neutral-100 mx-auto w-full">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex flex-1 items-center gap-4 w-full sm:w-auto">
					<div className="relative w-full sm:w-72">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
						<Input
							type="search"
							placeholder="Cari model material..."
							className="w-full pl-9 bg-card border-border focus-visible:ring-1 focus-visible:ring-neutral-700 placeholder:text-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
				<div className="flex flex-1 justify-end gap-2 w-full sm:w-auto">
					<div className="flex flex-wrap gap-1">
						<Button
							variant={viewMode === "grid" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => handleViewModeChange("grid")}
							className={`h-8 px-2.5 rounded-sm active:translate-y-0 active:not-aria-[haspopup]:translate-y-0 transition-none ${viewMode === "grid" ? "bg-neutral-800 text-neutral-100" : "text-muted-foreground hover:text-foreground"}`}>
							<LayoutGrid className="size-3.5" />
						</Button>
						<Button
							variant={viewMode === "table" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => handleViewModeChange("table")}
							className={`h-8 px-2.5 rounded-sm active:translate-y-0 active:not-aria-[haspopup]:translate-y-0 transition-none ${viewMode === "table" ? "bg-neutral-800 text-neutral-100" : "text-muted-foreground hover:text-foreground"}`}>
							<List className="size-3.5" />
						</Button>
					</div>
					<Button
						className="h-8 gap-2 rounded-sm"
						onClick={() => handleOpenSheet()}>
						<Plus className="w-4 h-4" /> Tambah Model Material
					</Button>
				</div>
			</div>

			{/* Mobile view toggle */}
			<div className="sm:hidden flex items-center p-1 rounded-lg border border-border bg-muted/50 w-full">
				<Button
					variant={viewMode === "grid" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => handleViewModeChange("grid")}
					className={`flex-1 h-8 active:translate-y-0 active:not-aria-[haspopup]:translate-y-0 transition-none ${viewMode === "grid" ? "bg-neutral-800 text-neutral-100" : "text-muted-foreground hover:text-foreground"}`}>
					<LayoutGrid className="size-4 mr-1.5" />
					Grid
				</Button>
				<Button
					variant={viewMode === "table" ? "secondary" : "ghost"}
					size="sm"
					onClick={() => handleViewModeChange("table")}
					className={`flex-1 h-8 active:translate-y-0 active:not-aria-[haspopup]:translate-y-0 transition-none ${viewMode === "table" ? "bg-neutral-800 text-neutral-100" : "text-muted-foreground hover:text-foreground"}`}>
					<List className="size-4 mr-1.5" />
					Table
				</Button>
			</div>

			{viewMode === "grid" ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-10">
					{filteredTypes.map((t) => (
						<Card
							key={t.id}
							className="overflow-hidden relative group transition-all duration-300 hover:border-border/80 hover:bg-muted/60">
							<CardContent className="px-5 py-2 flex flex-col h-full justify-between gap-15">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="font-medium text-sm text-foreground mb-1.5 leading-tight">
											{t.nama}
										</h3>
										<p className="text-xs text-muted-foreground">
											{t.brand?.nama || "-"}{" "}
											<span className="text-neutral-600 mx-1">|</span>{" "}
											{t.materialCategory?.nama || "-"}
										</p>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-7 w-7 rounded-md hover:bg-neutral-800 text-muted-foreground -mr-2 -mt-1">
												<MoreVertical className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="bg-neutral-950 border-border text-foreground">
											<DropdownMenuItem
												className="cursor-pointer focus:bg-neutral-800"
												onClick={() => handleOpenSheet(t.id)}>
												<Edit className="w-4 h-4 mr-2" /> Edit Model
											</DropdownMenuItem>
											<DropdownMenuItem
												className="text-red-400 focus:bg-red-950/50 focus:text-red-400 cursor-pointer"
												onClick={() =>
													setDeleteAlertData({
														isOpen: true,
														id: t.id,
														name: t.nama,
													})
												}>
												<Trash2 className="w-4 h-4 mr-2" /> Hapus Model
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div className="flex items-center gap-2.5">
									<span className="text-sm text-foreground font-medium">
										Total {t.totalItems ?? t._count?.items ?? 0} Unit
									</span>

									{t.code && (
										<span className="text-xs ml-auto px-2 pb-1 pt-1.5 rounded border border-border">
											{t.code}
										</span>
									)}
								</div>
							</CardContent>
						</Card>
					))}

					{filteredTypes.length === 0 && (
						<div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
							<div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4">
								<Search className="w-8 h-8 text-neutral-600" />
							</div>
							<h3 className="text-lg font-medium text-foreground mb-1">
								Model Material Tidak Ditemukan
							</h3>
							<p className="text-sm text-neutral-500 max-w-sm">
								Coba gunakan kata kunci lain atau tambahkan model material baru.
							</p>
						</div>
					)}
				</div>
			) : (
				<DataTable<ModelRow>
					data={filteredTypes}
					enableSelection
					getRowId={(row) => row.id}
					bulkActions={[
						{
							label: "Hapus terpilih",
							icon: Trash2,
							destructive: true,
							onAction: (ids) =>
								requestBulkDelete(
									ids.flatMap((id) => {
										const row = filteredTypes.find((t) => String(t.id) === id);
										return row ? [{ id: String(row.id), name: row.nama }] : [];
									}),
								),
						},
					]}
					columns={columns}
					emptyState={{
						icon: Search,
						title: searchQuery
							? "Model Material Tidak Ditemukan"
							: "Belum Ada Model Material",
						description: searchQuery
							? "Coba gunakan kata kunci lain atau tambahkan model material baru."
							: "Tambahkan model material sebagai referensi utama katalog.",
						action: (
							<Button
								size="sm"
								className="gap-1.5 cursor-pointer"
								onClick={() => handleOpenSheet()}>
								<Plus className="size-4" /> Tambah Model Material
							</Button>
						),
					}}
				/>
			)}

			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent className="sm:max-w-md border-border bg-neutral-950 p-0 flex flex-col text-foreground">
					<SheetHeader className="p-6 border-b border-border/60 bg-muted/20">
						<SheetTitle className="text-xl text-neutral-100">
							{editId ? "Edit Model Material" : "Tambah Model Material"}
						</SheetTitle>
						<SheetDescription className="text-muted-foreground">
							Kelola informasi referensi model material utama.
						</SheetDescription>
					</SheetHeader>
					<div className="p-6 flex-1 overflow-y-auto">
						<div className="grid gap-5">
							<div className="space-y-2">
								<Label>Kode Material</Label>
								<Input
									value={code}
									onChange={(e) => setCode(e.target.value)}
									placeholder="Masukkan Kode Material"
									className="bg-card border-border"
								/>
							</div>

							<div className="space-y-2">
								<Label>Nama Material</Label>
								<Input
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										setNameError("");
									}}
									placeholder="Masukkan Nama Material"
									className={`bg-card ${nameError ? "border-destructive" : "border-border"}`}
								/>
								{nameError && (
									<p className="text-xs text-destructive">{nameError}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>
									Deskripsi{" "}
									<span className="text-xs font-normal text-muted-foreground">(opsional)</span>
								</Label>
								<textarea
									value={deskripsi}
									onChange={(e) => setDeskripsi(e.target.value)}
									placeholder="Keterangan singkat tentang model material ini"
									rows={3}
									className="flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
								/>
							</div>

							<div className="space-y-2">
								<Label>Brand</Label>
								<Select
									value={brandId}
									onValueChange={(val) => {
										setBrandId(val);
										setBrandError("");
									}}>
									<SelectTrigger
										className={`bg-card ${brandError ? "border-destructive" : "border-border"}`}>
										<SelectValue placeholder="Pilih Merek Material" />
									</SelectTrigger>
									<SelectContent className="bg-neutral-950 border-border">
										{brands.map((b) => (
											<SelectItem key={b.id} value={String(b.id)}>
												{b.nama}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{brandError && (
									<p className="text-xs text-destructive">{brandError}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label>Kategori Material</Label>
								<Select
									value={materialCategoryId}
									onValueChange={(val) => {
										setMaterialCategoryId(val);
										setCategoryError("");
									}}>
									<SelectTrigger
										className={`bg-card ${categoryError ? "border-destructive" : "border-border"}`}>
										<SelectValue placeholder="Pilih Kategori Material" />
									</SelectTrigger>
									<SelectContent className="bg-neutral-950 border-border">
										{categories.map((c) => (
											<SelectItem key={c.id} value={String(c.id)}>
												{c.nama}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{categoryError && (
									<p className="text-xs text-destructive">{categoryError}</p>
								)}
							</div>
						</div>
					</div>
					<SheetFooter className="p-6 border-t border-border/60 bg-muted/20 flex sm:justify-end gap-3 sm:gap-2">
						<Button
							variant="outline"
							onClick={() => setIsSheetOpen(false)}
							disabled={isSaving}>
							Batal
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Simpan
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<AlertDialog
				open={deleteAlertData.isOpen}
				onOpenChange={(open) =>
					!open &&
					!isDeleting &&
					setDeleteAlertData({ ...deleteAlertData, isOpen: false })
				}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
						<AlertDialogDescription className="text-muted-foreground">
							Tindakan ini tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
							Lanjutkan
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

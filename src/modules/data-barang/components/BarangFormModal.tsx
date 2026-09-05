import React from "react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { Combobox, type ComboboxItem } from "@/shared/ui/combobox";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { StatusUnit } from "@/shared/types/inventory";

interface BarangFormModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	formMode: "add" | "edit";
	formData: {
		serialNumber: string;
		kategori: string;
		merek: string;
		tipe: string;
		status: StatusUnit;
		kondisi: string;
		lokasiPenyimpanan: string;
		ticket?: string;
		catatan?: string;
	};
	setFormData: React.Dispatch<
		React.SetStateAction<{
			serialNumber: string;
			kategori: string;
			merek: string;
			tipe: string;
			status: StatusUnit;
			kondisi: string;
			lokasiPenyimpanan: string;
			ticket?: string;
			catatan?: string;
		}>
	>;
	formErrors: Record<string, string>;
	isSaving: boolean;
	onSubmit: (e: React.FormEvent) => void;
	searchKategori: (query: string) => Promise<ComboboxItem[]>;
	searchMerek: (query: string) => Promise<ComboboxItem[]>;
	searchModel: (query: string, brand: string) => Promise<ComboboxItem[]>;
	searchLokasi: (query: string) => Promise<ComboboxItem[]>;
	STATUS_OPTIONS: StatusUnit[];
}

function Field({
	label,
	required = false,
	error,
	hint,
	className,
	children,
}: {
	label: string;
	required?: boolean;
	error?: string;
	hint?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<Label className="gap-1 text-sm font-medium text-muted-foreground">
				{label}
				{required && <span className="text-destructive">*</span>}
			</Label>
			<div className="w-full min-w-0 space-y-1">
				{children}
				{error ? (
					<p className="text-[11px] font-medium text-destructive">{error}</p>
				) : hint ? (
					<p className="text-[11px] text-muted-foreground/70">{hint}</p>
				) : null}
			</div>
		</div>
	);
}

export function BarangFormModal({
	isOpen,
	onOpenChange,
	formMode,
	formData,
	setFormData,
	formErrors,
	isSaving,
	onSubmit,
	searchKategori,
	searchMerek,
	searchModel,
	searchLokasi,
	STATUS_OPTIONS,
}: BarangFormModalProps) {
	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-5xl! w-[calc(100%-2rem)] sm:w-full max-h-[90vh] flex flex-col overflow-hidden">
				<form onSubmit={onSubmit} className="flex flex-col min-h-0">
					<AlertDialogHeader className="shrink-0">
						<div className="flex flex-col items-center gap-0.5 sm:items-start">
							<AlertDialogTitle className="text-lg font-medium">
								{formMode === "add" ? "Tambah Unit Baru" : "Edit Data Unit"}
							</AlertDialogTitle>
							<AlertDialogDescription className="text-sm text-muted-foreground">
								{formMode === "add"
									? "Lengkapi informasi unit yang akan ditambahkan ke dalam inventaris."
									: "Perbarui informasi unit untuk memastikan data inventaris tetap akurat."}
							</AlertDialogDescription>
						</div>
					</AlertDialogHeader>

					<div className="grid grid-cols-1 gap-x-8 gap-y-6 overflow-y-auto overflow-x-hidden px-1 py-4 text-sm lg:grid-cols-2">
						{/* LEFT — IDENTITAS */}
						<section className="min-w-0 space-y-4 lg:border-r lg:border-border/60 lg:pr-8">
							<div className="flex items-center gap-2.5">
								<h3 className="text-base font-medium">Identitas Material</h3>
							</div>

							<div className="space-y-3.5">
								<Field
									label="Serial Number (SN)"
									required
									error={formErrors.serialNumber}>
									<Input
										placeholder="SN-XXXX-XXXX"
										value={formData.serialNumber}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												serialNumber: e.target.value.toUpperCase(),
											}))
										}
										aria-invalid={!!formErrors.serialNumber}
										className="h-8 text-sm"
									/>
								</Field>

								<Field label="Kategori" required error={formErrors.kategori}>
									<Combobox
										value={formData.kategori}
										onChange={(val) =>
											setFormData((prev) => ({ ...prev, kategori: val }))
										}
										onSearch={searchKategori}
										placeholder="Pilih Kategori"
										searchPlaceholder="Cari kategori..."
										recentKey="kategori"
										className="rounded-sm!"
									/>
								</Field>

								<Field label="Merek" required error={formErrors.merek}>
									<Combobox
										value={formData.merek}
										onChange={(val) =>
											setFormData((prev) => ({ ...prev, merek: val }))
										}
										onSearch={searchMerek}
										placeholder="Pilih Merek"
										searchPlaceholder="Cari merek..."
										emptyText="Merek tidak ditemukan"
										recentKey="merek"
										className="rounded-sm!"
									/>
								</Field>

								<Field label="Tipe / Model" hint="Opsional">
									<Combobox
										value={formData.tipe}
										onChange={(val) =>
											setFormData((prev) => ({ ...prev, tipe: val }))
										}
										onSearch={(query) => searchModel(query, formData.merek)}
										placeholder="Pilih Model"
										searchPlaceholder="Cari model..."
										emptyText="Model tidak ditemukan"
										recentKey="model"
										className="rounded-sm!"
									/>
								</Field>
							</div>
						</section>

						{/* RIGHT — STATUS & PENEMPATAN */}
						<section className="min-w-0 space-y-4">
							<div className="flex items-center gap-2.5">
								<h3 className="text-base font-medium">Status & Penempatan</h3>
							</div>

							<div className="space-y-3.5">
								<Field label="Status Unit" required>
									<Select
										value={formData.status}
										onValueChange={(val) =>
											setFormData((prev) => ({
												...prev,
												status: val as StatusUnit,
											}))
										}>
										<SelectTrigger className="h-8 text-sm rounded-sm!">
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent>
											{STATUS_OPTIONS.map((st) => (
												<SelectItem key={st} value={st}>
													{st}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>

								<Field label="Kondisi" required>
									<Select
										value={formData.kondisi}
										onValueChange={(val) =>
											setFormData((prev) => ({ ...prev, kondisi: val }))
										}>
										<SelectTrigger className="h-8 text-sm rounded-sm!">
											<SelectValue placeholder="Pilih Kondisi" />
										</SelectTrigger>
										<SelectContent>
											{["Baru", "Bagus", "Rusak"].map((k) => (
												<SelectItem key={k} value={k}>
													{k}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>

								{(formData.kondisi || "").toLowerCase() === "rusak" && (
									<>
										<Field label="Asal Material" hint="Referensi asal material (contoh: nomor tiket)">

											<Input
												placeholder="TKT-XXXX atau Nama Asal"
												value={formData.ticket || ""}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														ticket: e.target.value,
													}))
												}
												className="h-8 text-sm"
											/>
										</Field>

										<Field label="Catatan Kerusakan">
											<Input
												placeholder="Deskripsi kerusakan material..."
												value={formData.catatan || ""}
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														catatan: e.target.value,
													}))
												}
												className="h-8 text-sm"
											/>
										</Field>
									</>
								)}

								<Field
									label="Lokasi Penyimpanan"
									required
									error={formErrors.lokasiPenyimpanan}
									hint={
										formData.status === "Terdistribusi"
											? "Unit sudah terdistribusi, lokasi tidak dipilih."
											: undefined
									}>
									<Combobox
										value={formData.lokasiPenyimpanan}
										onChange={(val) =>
											setFormData((prev) => ({
												...prev,
												lokasiPenyimpanan: val,
											}))
										}
										onSearch={searchLokasi}
										placeholder="Pilih Lokasi"
										searchPlaceholder="Cari lokasi..."
										emptyText="Lokasi tidak ditemukan"
										recentKey="lokasi"
										disabled={formData.status === "Terdistribusi"}
										className="rounded-sm!"
									/>
								</Field>
							</div>
						</section>
					</div>

					<AlertDialogFooter className="gap-2 p-4 sm:flex-row sm:items-center">
						<div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
							<AlertDialogCancel
								type="button"
								disabled={isSaving}
								onClick={() => onOpenChange(false)}
								className="h-8 text-sm w-full sm:w-auto cursor-pointer">
								Batal
							</AlertDialogCancel>
							<Button
								type="submit"
								disabled={isSaving}
								className="h-8 gap-1.5 text-sm w-full sm:w-auto cursor-pointer">
								{isSaving && <Loader2 className="size-3.5 animate-spin" />}
								{formMode === "add" ? "Simpan Unit" : "Perbarui Unit"}
							</Button>
						</div>
					</AlertDialogFooter>
				</form>
			</AlertDialogContent>
		</AlertDialog>
	);
}

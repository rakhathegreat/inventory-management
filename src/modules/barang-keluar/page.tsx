import { Archive, PackageMinus, X, Loader2, ScanLine } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import { formatItemStatus } from "@/shared/lib/status-helper";
import { useBarangKeluar } from "./hooks/useBarangKeluar";
import { EmptyScanTableState } from "./components/EmptyScanTableState";

export default function BarangKeluarPage() {
	const {
		kodeBarang,
		updateKodeBarang,
		inputRef,
		kodeBarangRef,
		handleSubmit,
		focusKodeBarangInput,
		dbPartners,
		selectedPartnerId,
		setSelectedPartnerId,
		barangKeluar,
		handleDeleteItem,
		handleValidateAll,
		isSaving,
	} = useBarangKeluar();

	return (
		<div className="@container/main flex h-full select-none flex-col gap-4 py-4 md:gap-6 md:py-6">
			<div className="flex h-full flex-col gap-4 px-4 lg:px-6">
				{/* Smart Input Bar */}
				<Card className="shrink-0 border-primary/20 shadow-sm">
					<CardContent className="flex flex-col gap-4 px-4 sm:px-5">
						<div className="flex flex-col items-end gap-4 sm:flex-row">
							<div className="w-full flex-1 space-y-1.5">
								<Label htmlFor="smart-input" className="text-sm font-semibold">
									Scan Barcode / SN
								</Label>
								<div className="relative">
									<ScanLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										ref={inputRef}
										id="smart-input"
										className="h-8 pl-9 text-base shadow-inner focus-visible:ring-primary/50"
										placeholder="Scan atau masukkan serial number disini..."
										value={kodeBarang}
										onChange={(event) => updateKodeBarang(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.preventDefault();
												handleSubmit(kodeBarangRef.current);
											}
										}}
									/>
								</div>
							</div>

							{(
								<div className="w-full space-y-1.5 sm:w-64">
									<Label
										htmlFor="mitra-tujuan"
										className="text-sm font-semibold">
										Tujuan (Mitra)
									</Label>
									<Select
										value={selectedPartnerId}
										onValueChange={(value) => {
											setSelectedPartnerId(value);
											focusKodeBarangInput();
										}}>
										<SelectTrigger id="mitra-tujuan" className="h-11">
											<SelectValue placeholder="Pilih mitra..." />
										</SelectTrigger>
										<SelectContent>
											{dbPartners.length === 0 ? (
												<div className="p-2 text-sm text-muted-foreground">
													Belum ada mitra aktif
												</div>
											) : (
												dbPartners.map((partner) => (
													<SelectItem key={partner.id} value={partner.id}>
														{partner.name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
								</div>
							)}

							<Button
								className="h-8 w-full gap-2 sm:w-32"
								onClick={() => handleSubmit(kodeBarangRef.current)}>
								<PackageMinus className="size-4" />
								Tambah
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Tabel Layar Penuh */}
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-base font-medium">Daftar Distribusi Material</h2>
						<Badge variant="secondary">{barangKeluar.length} Item</Badge>
					</div>
					<Button
						className="shrink-0 gap-2 cursor-pointer"
						onClick={handleValidateAll}
						disabled={barangKeluar.length === 0 || isSaving}>
						{isSaving ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Archive className="size-4" />
						)}
						Simpan Distribusi Material
					</Button>
				</div>

				{/* Tabel Layar Penuh */}
				<div className="flex-1 overflow-auto rounded-lg border">
					<Table className="min-w-[900px]">
						<TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-md">
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-12 pl-4">No</TableHead>
								<TableHead>Serial Number</TableHead>
								<TableHead>Merek</TableHead>
								<TableHead>Kategori</TableHead>
								<TableHead>Model Material</TableHead>
								<TableHead>Asal Lokasi</TableHead>
								<TableHead>Mitra</TableHead>
								<TableHead>Status Validasi</TableHead>
								<TableHead className="w-16 text-center">Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{barangKeluar.length === 0 ? (
								<TableRow>
									<TableCell colSpan={9} className="h-[300px] p-0">
										<EmptyScanTableState />
									</TableCell>
								</TableRow>
							) : (
								barangKeluar.map((item, index) => (
									<TableRow key={item.id} className="hover:bg-muted/40">
										<TableCell className="pl-4 text-sm text-muted-foreground">
											{index + 1}
										</TableCell>
										<TableCell className="font-mono text-sm font-medium">
											{item.nomor}
										</TableCell>
										<TableCell className="text-sm">{item.merek}</TableCell>
										<TableCell>
											<Badge
												variant="secondary"
												size="sm">
												{item.kategori}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{item.tipe || "-"}
										</TableCell>
										<TableCell className="text-sm">{item.lokasi}</TableCell>
										<TableCell className="text-sm font-medium">
											{item.mitra}
										</TableCell>
										<TableCell>
											<StatusBadge status={formatItemStatus(item.status)} />
										</TableCell>
										<TableCell className="text-center">
											<Button
												variant="ghost"
												size="icon-sm"
												className="text-muted-foreground hover:text-destructive"
												onClick={() => handleDeleteItem(item.id)}>
												<X className="size-4" />
												<span className="sr-only">Hapus item</span>
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}

import { useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Combobox } from "@/shared/ui/combobox";
import { detectMitraFromSN } from "../utils/brandDetector";
import { ModelSelectPopover } from "./ModelSelectPopover";
import { searchAsalMaterial, searchMaterialModels } from "../api/barangMasukApi";
import type { Partner } from "@/shared/types/partner";
import { Textarea } from "@/shared/ui/textarea";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface InboundFormCardProps {
	asalBarang: string;
	setAsalBarang: (val: string) => void;
	asalBarangManual: boolean;
	setAsalBarangManual: (val: boolean) => void;
	dbPartners: Partner[];
	kodeBarang: string;
	updateKodeBarang: (val: string) => void;
	inputRef: React.RefObject<HTMLInputElement>;
	kodeBarangRef: React.MutableRefObject<string>;
	handleSubmit: (kode?: string) => void;
	itemCondition: "baru" | "dismantle" | "rusak";
	setItemCondition: (val: "baru" | "dismantle" | "rusak") => void;
	nomorPA: string;
	setNomorPA: (val: string) => void;
	ticket: string;
	setTicket: (val: string) => void;
	tipeBarang: string;
	setTipeBarang: (val: string) => void;
	brand: string;
	setBrand: (val: string) => void;
	kategori: string;
	setKategori: (val: string) => void;
	dbBrands: any[];
	dbCategories: any[];
	catatan: string;
	setCatatan: (val: string) => void;
	focusKodeBarangInput: () => void;
}

export function InboundFormCard({
	asalBarang,
	setAsalBarang,
	asalBarangManual,
	setAsalBarangManual,
	dbPartners,
	kodeBarang,
	updateKodeBarang,
	inputRef,
	kodeBarangRef,
	handleSubmit,
	itemCondition,
	setItemCondition,
	nomorPA,
	setNomorPA,
	ticket,
	setTicket,
	tipeBarang,
	setTipeBarang,
	brand: _brand,
	setBrand: _setBrand,
	kategori: _kategori,
	setKategori: _setKategori,
	dbBrands: _dbBrands,
	dbCategories: _dbCategories,
	catatan,
	setCatatan,
	focusKodeBarangInput,
}: InboundFormCardProps) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<Card className="@container/card flex flex-col w-full">
			<Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
				<div className="px-4 flex flex-col gap-4">
					<div className="flex flex-col gap-2.5">
						<div className="flex items-center justify-between gap-2">
							<Input
								ref={inputRef}
								id="kode-barang-manual"
								value={kodeBarang}
								onChange={(event) => updateKodeBarang(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										handleSubmit(kodeBarangRef.current);
									}
								}}
								placeholder="Scan barcode atau ketik manual di sini..."
								className="rounded-sm h-8"
							/>
							<CollapsibleTrigger asChild>
								<Button size="sm" className="h-8 rounded-sm cursor-pointer">
									{isOpen ? "Simpan" : "Edit"}
									<ChevronDown
										className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
									/>
									<span className="sr-only">Toggle</span>
								</Button>
							</CollapsibleTrigger>
						</div>
					</div>
				</div>

				<CollapsibleContent>
					<CardContent className="px-4 pb-2 pt-5">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Kolom Kiri */}
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-3">
									<Label htmlFor="asal-material">Asal Material</Label>
									<Combobox
										value={asalBarang}
										onChange={(value) => {
											setAsalBarang(value);
											setAsalBarangManual(true);
											focusKodeBarangInput();
										}}
										onSearch={searchAsalMaterial}
										placeholder="Pilih asal material..."
										searchPlaceholder="Cari asal material..."
										emptyText="Asal material tidak ditemukan"
										recentKey="asal"
										className="rounded-sm!"
									/>
									{asalBarangManual ? (
										<div className="flex items-center justify-between gap-2 -mt-1"></div>
									) : (
										detectMitraFromSN(kodeBarang, dbPartners) && (
											<p className="-mt-1 text-xs text-sky-600 dark:text-sky-400">
												Terdeteksi otomatis dari SN
											</p>
										)
									)}
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="tipe-barang">Model</Label>
									<ModelSelectPopover
										value={tipeBarang}
										onChange={setTipeBarang}
										onCloseFocus={focusKodeBarangInput}
										onSearch={searchMaterialModels}
										placeholder="Pilih Model (wajib jika SN belum terdaftar)"
									/>
								</div>

								<p className="text-xs text-muted-foreground">
									Kategori dan merek akan terdeteksi otomatis dari model atau
									SN.
								</p>
							</div>

							{/* Kolom Kanan */}
							<div className="flex flex-col gap-4">
								<div className="space-y-4">
									<Label>Kondisi Material</Label>
									<RadioGroup
										value={itemCondition}
										onValueChange={(val) => {
											const condition = val as "baru" | "dismantle" | "rusak";
											setItemCondition(condition);
											if (condition === "baru") {
												setCatatan("");
											}
											focusKodeBarangInput();
										}}
										className="flex gap-4 pt-1">
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="baru" id="condition-baru" />
											<Label
												htmlFor="condition-baru"
												className="cursor-pointer font-normal">
												Baru
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem
												value="dismantle"
												id="condition-dismantle"
											/>
											<Label
												htmlFor="condition-dismantle"
												className="cursor-pointer font-normal">
												Dismantle
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="rusak" id="condition-rusak" />
											<Label
												htmlFor="condition-rusak"
												className="cursor-pointer font-normal">
												Rusak
											</Label>
										</div>
									</RadioGroup>
								</div>

								{itemCondition === "dismantle" && (
									<div className="space-y-1.5">
										<Label htmlFor="nomor-pa">Nomor PA</Label>
										<Input
											id="nomor-pa"
											value={nomorPA}
											onChange={(e) => setNomorPA(e.target.value)}
											placeholder="Masukkan nomor PA..."
										/>
									</div>
								)}

								{itemCondition === "rusak" && (
									<div className="space-y-1.5">
										<Label htmlFor="ticket">Ticket</Label>
										<Input
											id="ticket"
											value={ticket}
											onChange={(e) => setTicket(e.target.value)}
											placeholder="Masukkan nomor ticket..."
										/>
										<div className="space-y-1.5">
											<Label htmlFor="dismantle-remark">Kerusakan</Label>
											<Textarea
												id="dismantle-remark"
												value={catatan}
												onChange={(e) => setCatatan(e.target.value)}
												placeholder="Masukkan kerusakan..."
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

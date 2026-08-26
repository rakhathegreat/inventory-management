import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { SheetMode } from "@/shared/types/ui";

export interface LokasiSheetProps {
	mode: SheetMode;
	brands: string[];
	locName: string;
	setLocName: (v: string) => void;
	locCapacity: string;
	setLocCapacity: (v: string) => void;
	locBrand: string;
	setLocBrand: (v: string) => void;
	locLevelsCount: string;
	setLocLevelsCount: (v: string) => void;
}

function CapacityInput({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className="space-y-1.5">
			<Label htmlFor="loc-capacity" className="flex items-center justify-between text-xs font-medium text-foreground">
				<span>Kapasitas maksimal</span>
				<span className="text-[10px] font-normal text-muted-foreground">Dapat diubah nanti</span>
			</Label>
			<div className="relative">
				<Input
					id="loc-capacity"
					type="number"
					min="0"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="Masukkan total kapasitas"
					className="pr-12 text-sm tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
				<span className="absolute right-3 top-1/2 -translate-y-1/2 select-none text-xs text-muted-foreground">
					unit
				</span>
			</div>
		</div>
	);
}

const BrandRuleSelect = ({ brands, value, onChange }: { brands: string[]; value: string; onChange: (v: string) => void }) => (
	<div className="space-y-1.5">
		<Label className="text-xs font-medium text-foreground">Aturan merek</Label>
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="cursor-pointer"><SelectValue placeholder="Pilih aturan merek" /></SelectTrigger>
			<SelectContent>
				{brands.map((b) => (
					<SelectItem key={b} value={b} className="cursor-pointer">
						{b}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
		<p className="text-[11px] text-muted-foreground">
			Materi dengan merek lain tidak bisa disimpan di lokasi ini.
		</p>
	</div>
);

/** Field-form di dalam Sheet lokasi, sesuai mode add/edit rak/kardus/pallet/level. */
export function LokasiSheet(props: LokasiSheetProps) {
	const { mode, brands } = props;

	if (mode === "add-rak" || mode === "edit-rak")
		return (
			<>
				<div className="space-y-1.5">
					<Label htmlFor="loc-name" className="text-xs font-medium text-foreground">
						Nama rak
					</Label>
					{mode === "add-rak" ? (
						<>
							<Input id="loc-name" value={props.locName} readOnly className="cursor-not-allowed bg-muted/50 text-muted-foreground" />
							<p className="text-[11px] text-muted-foreground">Nama rak dibuat otomatis (Shelf 1, Shelf 2, ...)</p>
						</>
					) : (
						<Input
							id="loc-name"
							value={props.locName}
							onChange={(e) => props.setLocName(e.target.value)}
							placeholder="Contoh: Shelf 1"
						/>
					)}
				</div>
				{mode === "add-rak" && (
					<div className="space-y-1.5">
						<Label htmlFor="loc-levels" className="text-xs font-medium text-foreground">
							Jumlah level awal
						</Label>
						<Input
							id="loc-levels"
							type="number"
							min="1"
							value={props.locLevelsCount}
							onChange={(e) => props.setLocLevelsCount(e.target.value)}
							placeholder="Masukkan jumlah level"
							className="tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
					</div>
				)}
			</>
		);

	if (mode === "add-kardus" || mode === "edit-kardus")
		return (
			<>
				<div className="space-y-1.5">
					<Label htmlFor="loc-name" className="text-xs font-medium text-foreground">
						Nama kardus
					</Label>
					<Input
						id="loc-name"
						value={props.locName}
						onChange={(e) => props.setLocName(e.target.value)}
						placeholder="Contoh: Kardus K-01"
					/>
				</div>
				<CapacityInput value={props.locCapacity} onChange={props.setLocCapacity} />
				<BrandRuleSelect brands={brands} value={props.locBrand} onChange={props.setLocBrand} />
			</>
		);

	if (mode === "add-pallet" || mode === "edit-pallet")
		return (
			<>
				<div className="space-y-1.5">
					<Label htmlFor="loc-name" className="text-xs font-medium text-foreground">
						Nama pallet
					</Label>
					<Input
						id="loc-name"
						value={props.locName}
						onChange={(e) => props.setLocName(e.target.value)}
						placeholder="Contoh: Pallet P-01"
					/>
				</div>
				<CapacityInput value={props.locCapacity} onChange={props.setLocCapacity} />
				<BrandRuleSelect brands={brands} value={props.locBrand} onChange={props.setLocBrand} />
			</>
		);

	if (mode === "add-level" || mode === "edit-level")
		return (
			<>
				<CapacityInput value={props.locCapacity} onChange={props.setLocCapacity} />
				<BrandRuleSelect brands={brands} value={props.locBrand} onChange={props.setLocBrand} />
			</>
		);

	return null;
}

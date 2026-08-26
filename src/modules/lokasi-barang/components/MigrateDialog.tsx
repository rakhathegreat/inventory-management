import type { StorageLocation } from "@/shared/types/inventory";
import * as React from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";

export interface MigrateTargetOption {
	id: string;
	label: string;
	/** Sisa slot tujuan; null = tanpa batas (kapasitas 0/null). */
	remaining: number | null;
}

/** Ratakan seluruh lokasi KP aktif menjadi opsi tujuan migrasi. */
export function flattenMigrateTargets(
	locations: StorageLocation[],
	excludeId?: string,
): MigrateTargetOption[] {
	const out: MigrateTargetOption[] = [];
	for (const loc of locations) {
		if (!loc.isActive) continue;
		if (loc.type === "Rak") {
			for (const lvl of loc.levels ?? []) {
				const lvlId = String(lvl.id);
				if (!lvl.isActive || lvlId === excludeId) continue;
				out.push({
					id: lvlId,
					label: `${loc.name} - ${lvl.name}`,
					remaining: lvl.capacity ? lvl.capacity - (lvl.usedCapacity || 0) : null,
				});
			}
		} else {
			const locId = String(loc.id);
			if (locId === excludeId) continue;
			out.push({
				id: locId,
				label: loc.name,
				remaining: loc.capacity ? loc.capacity - (loc.usedCapacity || 0) : null,
			});
		}
	}
	return out;
}

export interface MigrateDialogProps {
	isOpen: boolean;
	sourceLabel: string;
	itemCount: number;
	targets: MigrateTargetOption[];
	isSubmitting: boolean;
	onSubmit: (targetId: string) => Promise<void>;
	onClose: () => void;
}

/** Dialog migrasi: pindahkan seluruh item dari satu lokasi ke lokasi lain. */
export function MigrateDialog({
	isOpen,
	sourceLabel,
	itemCount,
	targets,
	isSubmitting,
	onSubmit,
	onClose,
}: MigrateDialogProps) {
	const [targetId, setTargetId] = React.useState("");

	React.useEffect(() => {
		if (isOpen) setTargetId("");
	}, [isOpen]);

	const selected = targets.find((t) => t.id === targetId) ?? null;
	const insufficient =
		selected?.remaining !== null && selected !== null && selected.remaining < itemCount;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!targetId || insufficient || isSubmitting) return;
		try {
			await onSubmit(targetId);
			onClose();
		} catch {
			// Error sudah ditampilkan sebagai toast oleh pemanggil.
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Pindahkan Isi Lokasi</DialogTitle>
					<DialogDescription className="text-xs">
						Seluruh material di lokasi sumber akan dipindahkan ke lokasi tujuan
						dalam satu transaksi.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="grid gap-4">
					{/* Sumber */}
					<div className="grid gap-1.5">
						<Label className="text-sm font-medium">Dari</Label>
						<div className="rounded-lg border bg-muted/40 px-3 py-2">
							<p className="text-sm font-medium text-foreground">{sourceLabel}</p>
							<p className="text-xs tabular-nums text-muted-foreground">
								{itemCount} item akan dipindahkan
							</p>
						</div>
					</div>

					<div className="flex justify-center">
						<ArrowRightLeft className="size-4 text-muted-foreground" />
					</div>

					{/* Tujuan */}
					<div className="grid gap-1.5">
						<Label htmlFor="migrate-target" className="text-sm font-medium">
							Ke
						</Label>
						<Select value={targetId} onValueChange={setTargetId}>
							<SelectTrigger id="migrate-target" className="cursor-pointer">
								<SelectValue placeholder="Pilih lokasi tujuan..." />
							</SelectTrigger>
							<SelectContent>
								{targets.map((t) => (
									<SelectItem key={t.id} value={t.id} disabled={t.remaining !== null && t.remaining <= 0} className="cursor-pointer">
										<span className="flex w-full items-center justify-between gap-3">
											<span className="truncate">{t.label}</span>
											<span className="shrink-0 font-mono text-[10px] text-muted-foreground">
												{t.remaining === null ? "∞" : `sisa ${t.remaining}`}
											</span>
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{insufficient && (
							<p className="text-xs text-destructive">
								Kapasitas tujuan kurang {itemCount - (selected?.remaining ?? 0)} unit.
								Migrasi akan ditolak.
							</p>
						)}
					</div>

					<DialogFooter className="gap-2">
						<Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="cursor-pointer text-xs">
							Batal
						</Button>
						<Button
							type="submit"
							disabled={!targetId || insufficient || isSubmitting}
							className="cursor-pointer gap-2 text-xs">
							{isSubmitting ? (
								<>
									<Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> Memindahkan...
								</>
							) : (
								<>
									<ArrowRightLeft className="size-3.5" /> Pindahkan {itemCount} item
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

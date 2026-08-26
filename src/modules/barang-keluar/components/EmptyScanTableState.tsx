import { PackageMinus } from "lucide-react";

export function EmptyScanTableState() {
	return (
		<div className="flex items-center justify-center px-6 py-12">
			<div className="flex max-w-md flex-col items-center gap-4 text-center">
				<div className="flex size-14 items-center justify-center rounded-full border border-dashed bg-muted/40 text-muted-foreground">
					<PackageMinus className="size-7" strokeWidth={1.8} />
				</div>
				<div className="space-y-1.5">
					<p className="text-base font-semibold text-foreground">
						Belum ada material keluar
					</p>
					<p className="text-sm leading-relaxed text-muted-foreground">
						Scan atau masukkan serial number dari form di sebelah kiri untuk menambahkan item ke sesi keluar.
					</p>
				</div>
			</div>
		</div>
	);
}

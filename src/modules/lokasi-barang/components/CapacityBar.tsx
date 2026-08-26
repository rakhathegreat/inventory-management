import { getProgressStyles } from "../utils/lokasi";
import { cn } from "@/shared/lib/utils";

interface CapacityBarProps {
	used: number;
	capacity: number;
	/** Kelas warna dasar bar, dari TYPE_CONFIG. */
	baseBarClass: string;
	className?: string;
}

/**
 * Indikator kapasitas satu baris: bar + "terpakai/total" + persen.
 * Warna berubah di >70% (amber) dan >=100% (destructive) via getProgressStyles.
 */
export function CapacityBar({ used, capacity, baseBarClass, className }: CapacityBarProps) {
	const { pct, barClass } = getProgressStyles(used, capacity, baseBarClass);

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div
				role="progressbar"
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`${used} dari ${capacity} unit terpakai`}
				className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
				<div
					className={cn(
						"h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
						barClass,
					)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
				<span className="font-medium text-foreground">{used}</span>/{capacity}
				<span className={cn("ml-1 font-medium", pct >= 100 ? "text-destructive" : pct > 70 ? "text-amber-500" : "")}>
					{pct}%
				</span>
			</span>
		</div>
	);
}

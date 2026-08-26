import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import type { LokasiStats } from "../utils/lokasi";

interface Segment {
	key: string;
	pct: number;
	barClass: string;
	dotClass: string;
}

const SEGMENT_MIN_LABEL_PCT = 14;

/** Panel okupansi gudang: angka besar + bar tersegmentasi berlabel inline + totals. */
export function OccupancyPanel({ stats }: { stats: LokasiStats }) {
	const total = stats.maxCapacity || 1;
	const segments: Segment[] = [
		{ key: "Rak", used: stats.rakUsed },
		{ key: "Kardus", used: stats.kardusUsed },
		{ key: "Pallet", used: stats.palletUsed },
	].map(({ key, used }) => {
		const pct = Math.round((used / total) * 100);
		return { key, pct, barClass: segmentColor(key), dotClass: segmentColor(key) };
	});
	const freePct = Math.max(0, 100 - segments.reduce((a, s) => a + s.pct, 0));
	const narrow = segments.filter((s) => s.pct > 0 && s.pct < SEGMENT_MIN_LABEL_PCT);

	return (
		<Card className="h-full p-4 md:p-5">
			<div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
				{/* Angka utama */}
				<div className="shrink-0">
					<p className="text-3xl font-semibold tabular-nums leading-tight tracking-tight text-foreground">
						{stats.utilizationPct}%
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">terpakai</p>
					<p className="text-xs tabular-nums text-muted-foreground">
						{stats.usedCapacity.toLocaleString("id-ID")} dari{" "}
						{stats.maxCapacity.toLocaleString("id-ID")} unit
					</p>
				</div>

				{/* Bar + legenda + totals */}
				<div className="min-w-0 flex-1">
					<div
						className="flex h-6 w-full overflow-hidden rounded-md bg-muted"
						role="img"
						aria-label={`Okupansi gudang ${stats.utilizationPct}%. ${segments
							.map((s) => `${s.key} ${s.pct}%`)
							.join(", ")}, Kosong ${freePct}%.`}>
						{segments.map(
							(s) =>
								s.pct > 0 && (
									<div
										key={s.key}
										className={cn(
											"flex h-full items-center justify-center overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none",
											s.barClass,
											s.key === "Rak" && "rounded-l-lg",
										)}
										style={{ width: `${s.pct}%` }}>
										{s.pct >= SEGMENT_MIN_LABEL_PCT && (
											<span className="truncate px-2 text-[11px] font-medium tabular-nums text-white">
												{s.key} {s.pct}%
											</span>
										)}
									</div>
								),
						)}
					</div>

					{narrow.length > 0 && (
						<p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
							{narrow.map((s) => (
								<span key={s.key} className="flex items-center gap-1.5">
									<span className={cn("size-2 rounded-full", s.dotClass)} />
									<span className="tabular-nums">
										{s.key} {s.pct}%
									</span>
								</span>
							))}
						</p>
					)}

					<dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t pt-2.5 text-xs">
						{[
							["Terpakai", stats.usedCapacity],
							["Tersedia", Math.max(0, stats.maxCapacity - stats.usedCapacity)],
							["Total kapasitas", stats.maxCapacity],
						].map(([label, value]) => (
							<div key={label as string} className="flex items-center gap-1.5">
								<dt className="text-muted-foreground">{label}</dt>
								<dd className="font-semibold tabular-nums text-foreground">
									{value.toLocaleString("id-ID")} unit
								</dd>
							</div>
						))}
					</dl>
				</div>
			</div>
		</Card>
	);
}

function segmentColor(key: string) {
	if (key === "Kardus") return "bg-amber-500";
	if (key === "Pallet") return "bg-emerald-500";
	if (key === "Kosong") return "bg-muted";
	return "bg-blue-500";
}

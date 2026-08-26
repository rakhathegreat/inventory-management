import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { AlertTriangle, Boxes, RefreshCw } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/shared/ui/chart";
import { OccupancyPanel } from "../components/OccupancyPanel";
import { useStatistikGudang, type DistributionSlice } from "../hooks/useStatistikGudang";

const chartConfig = {
	jumlah: { label: "Unit" },
} satisfies ChartConfig;

function DistributionCard({
	title,
	description,
	data,
	isLoading,
}: {
	title: string;
	description: string;
	data: DistributionSlice[];
	isLoading: boolean;
}) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
				<CardDescription className="text-xs">{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex flex-col gap-2.5 py-2">
						{[1, 2, 3, 4].map((i) => (
							<div key={i} className="flex items-center gap-3">
								<Skeleton className="h-3 w-16 shrink-0" />
								<Skeleton className="h-5 flex-1 rounded-sm" />
							</div>
						))}
					</div>
				) : data.length === 0 ? (
					<p className="py-8 text-center text-xs text-muted-foreground">Belum ada data material.</p>
				) : (
					<ChartContainer config={chartConfig} className="h-52 w-full">
						<BarChart
							accessibilityLayer
							data={data}
							layout="vertical"
							margin={{ top: 0, right: 36, left: 0, bottom: 0 }}
							barCategoryGap={5}>
							<XAxis type="number" hide />
							<YAxis
								dataKey="name"
								type="category"
								tickLine={false}
								axisLine={false}
								width={80}
								tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
							/>
							<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
							<CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
							<Bar
								dataKey="jumlah"
								fill="var(--primary)"
								radius={[0, 4, 4, 0]}
								barSize={18}
								isAnimationActive={false}>
								<LabelList
									dataKey="jumlah"
									position="right"
									offset={6}
									className="fill-muted-foreground tabular-nums"
									fontSize={11}
								/>
							</Bar>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}

/** Tab statistik gudang KP: okupansi + ringkasan material. */
export default function StatistikTab() {
	const { stats, materialStats, isLoading, error, reload } = useStatistikGudang();

	if (error && !isLoading) {
		return (
			<div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-24 text-center">
				<div className="mb-2 flex size-14 items-center justify-center rounded-xl bg-muted">
					<AlertTriangle className="size-6 text-muted-foreground" />
				</div>
				<h2 className="text-base font-semibold text-foreground">Statistik gagal dimuat</h2>
				<p className="max-w-sm text-xs text-muted-foreground">{error}</p>
				<Button variant="outline" size="sm" className="mt-1 cursor-pointer gap-2 text-xs" onClick={() => reload()}>
					<RefreshCw className="size-3.5" /> Coba lagi
				</Button>
			</div>
		);
	}

	const statusCards = materialStats?.statusCounts ?? [];

	return (
		<div className="flex flex-col gap-4 pb-10">
			{/* Baris 1: total material + okupansi */}
			<div className="grid gap-4 lg:grid-cols-3">
				<Card className="border-primary/25 bg-primary/5">
					<CardContent className="flex h-full flex-col justify-center p-5">
						<p className="text-xs font-medium text-muted-foreground">Total Material</p>
						{isLoading ? (
							<Skeleton className="mt-2 h-10 w-28" />
						) : (
							<p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-primary">
								{(materialStats?.total ?? 0).toLocaleString("id-ID")}
							</p>
						)}
						<p className="mt-1 text-xs text-muted-foreground">unit tercatat di gudang KP</p>
					</CardContent>
				</Card>

				<div className="lg:col-span-2">
					{isLoading ? <Skeleton className="h-full min-h-40 w-full rounded-xl" /> : <OccupancyPanel stats={stats} />}
				</div>
			</div>

			{/* Baris 2: ringkasan per status */}
			<section aria-label="Ringkasan status material" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{isLoading
					? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)
					: statusCards.map(({ name, jumlah }) => (
							<Card key={name}>
								<CardContent className="flex h-full flex-col justify-center p-5">
									<p className="truncate text-xs font-medium text-muted-foreground">{name}</p>
									<p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
										{jumlah.toLocaleString("id-ID")}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">unit</p>
								</CardContent>
							</Card>
						))}
			</section>

			{/* Distribusi */}
			<section aria-label="Distribusi material" className="grid gap-4 lg:grid-cols-2">
				<DistributionCard
					title="Per Kategori"
					description="Enam kategori material terbanyak"
					data={materialStats?.kategoriTop ?? []}
					isLoading={isLoading}
				/>
				<DistributionCard
					title="Per Merek"
					description="Enam merek material terbanyak"
					data={materialStats?.merekTop ?? []}
					isLoading={isLoading}
				/>
			</section>

			{!isLoading && (materialStats?.total ?? 0) === 0 && (
				<div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-xs text-muted-foreground">
					<Boxes className="size-4" /> Belum ada material tercatat. Tambahkan lewat modul Material Masuk.
				</div>
			)}
		</div>
	);
}

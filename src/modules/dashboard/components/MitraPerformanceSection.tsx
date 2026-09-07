import { useState } from "react";
import { LeaderboardCard } from "@/modules/dashboard/components/LeaderboardCard";
import { ProductivityTable } from "@/modules/dashboard/components/ProductivityTable";
import type { MitraPerformanceMetrics } from "@/modules/dashboard/types";

interface MitraPerformanceSectionProps {
	metrics: MitraPerformanceMetrics[];
	isLoading: boolean;
}

export function MitraPerformanceSection({
	metrics,
	isLoading,
}: MitraPerformanceSectionProps) {
	// State hover dicolate di sini agar hover baris/card tidak me-render
	// ulang chart, kartu KPI, maupun widget lain di halaman.
	const [hoveredMitraId, setHoveredMitraId] = useState<string | null>(null);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 lg:px-6">
			<LeaderboardCard
				metrics={metrics}
				isLoading={isLoading}
				activeHoverId={hoveredMitraId}
				onHoverMitra={setHoveredMitraId}
				className="lg:col-span-1"
			/>
			<ProductivityTable
				metrics={metrics}
				isLoading={isLoading}
				activeHoverId={hoveredMitraId}
				onHoverMitra={setHoveredMitraId}
				className="lg:col-span-2"
			/>
		</div>
	);
}
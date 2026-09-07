import { SectionCards } from "@/modules/dashboard/components/section-cards";
import { ChartBarMixed } from "@/modules/dashboard/components/bar-chart";
import { ChartInboundOutbound } from "@/modules/dashboard/components/chart-inbound-outbound";
import { RequestSection } from "@/modules/dashboard/components/RequestSection";
import { ActivityFeedCard } from "@/modules/dashboard/components/ActivityFeedCard";
import { MitraPerformanceSection } from "@/modules/dashboard/components/MitraPerformanceSection";
import { IdleStockAlert } from "@/modules/dashboard/components/IdleStockAlert";
import { useDashboard } from "./use-dashboard";

export default function DashboardPage() {
	const {
		inventoryStats,
		mitraDistribution,
		transactionSeries,
		timeRange,
		setTimeRange,
		requestCounts,
		recentRequests,
		recentTransactions,
		mitraPerformanceMetrics,
		isLoadingRequests,
		isLoadingActivity,
		isLoading,
	} = useDashboard();

	return (
		<div className="@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6">
			{/* Row 1: Inventory KPI cards */}
			<SectionCards
				stats={inventoryStats}
				totalLabel="Total Material"
			/>

			{/* Idle Stock Alert */}
			<div className="px-4 lg:px-6">
				<IdleStockAlert
					metrics={mitraPerformanceMetrics}
					isLoading={isLoading}
				/>
			</div>

			{/* Mitra Performance */}
			<MitraPerformanceSection
				metrics={mitraPerformanceMetrics}
				isLoading={isLoading}
			/>

			{/* Row 2: Charts (50/50) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 lg:px-6">
				<ChartBarMixed
					data={mitraDistribution}
					isLoading={isLoading}
					className="h-full"
				/>
				<ChartInboundOutbound
					data={transactionSeries}
					timeRange={timeRange}
					onTimeRangeChange={setTimeRange}
					className="h-full"
				/>
			</div>

			{/* Row 3: Request Section (2/3) + Recent Activities (1/3) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 lg:px-6 pb-4">
				<RequestSection
					requests={recentRequests}
					counts={requestCounts}
					isLoading={isLoadingRequests}
					className="lg:col-span-2"
				/>
				<ActivityFeedCard
					activities={recentTransactions}
					isLoading={isLoadingActivity}
					className="lg:col-span-1"
				/>
			</div>
		</div>
	);
}
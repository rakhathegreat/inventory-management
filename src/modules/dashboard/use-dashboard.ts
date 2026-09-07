import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { DashboardService } from "@/modules/dashboard/dashboard.service";
import type { DashboardSummary } from "@/modules/dashboard/types";
import type { InventoryStats } from "@/modules/dashboard/types";

const DASHBOARD_REFRESH_INTERVAL = 15000;

const getRangeDays = (timeRange: string) => {
	if (timeRange === "7d") return 7;
	if (timeRange === "90d") return 90;
	return 30;
};

const EMPTY_INVENTORY: InventoryStats = {
	totalItems: 0,
	tersedia: 0,
	diluar: 0,
	rusak: 0,
	hilang: 0,
};

export function useDashboard() {
	const [summary, setSummary] = useState<DashboardSummary | null>(null);
	const [timeRange, setTimeRange] = useState("30d");
	const [isLoadingRequests, setIsLoadingRequests] = useState(true);
	const [isLoadingActivity, setIsLoadingActivity] = useState(true);
	const [isLoading, setIsLoading] = useState(true);

	const controllerRef = useRef<AbortController | null>(null);

	const fetchDashboardData = useCallback(async () => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;

		try {
			const data = await DashboardService.fetchSummary(controller.signal);
			setSummary(data);
			setIsLoading(false);
			setIsLoadingRequests(false);
			setIsLoadingActivity(false);
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				return;
			}
			console.error("Gagal mengambil data dashboard:", error);
			setIsLoading(false);
			setIsLoadingRequests(false);
			setIsLoadingActivity(false);
		}
	}, []);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") fetchDashboardData();
		};

		fetchDashboardData();
		const refreshInterval = window.setInterval(
			fetchDashboardData,
			DASHBOARD_REFRESH_INTERVAL,
		);

		window.addEventListener("focus", fetchDashboardData);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.clearInterval(refreshInterval);
			window.removeEventListener("focus", fetchDashboardData);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			controllerRef.current?.abort();
		};
	}, [fetchDashboardData]);

	const inventoryStats = summary?.inventoryStats ?? EMPTY_INVENTORY;
	const mitraDistribution = summary?.mitraDistribution ?? [];
	const requestCounts = summary?.requestCounts ?? { menunggu: 0, siap: 0 };
	const recentRequests = summary?.recentRequests ?? [];
	const recentTransactions = summary?.recentActivity ?? [];
	const mitraPerformanceMetrics = summary?.mitraPerformance ?? [];

	const transactionSeries = useMemo(() => {
		const series = summary?.transactionSeries ?? [];
		const rangeDays = getRangeDays(timeRange);
		return series.slice(Math.max(0, series.length - rangeDays));
	}, [summary, timeRange]);

	return {
		inventoryStats,
		mitraDistribution,
		transactionSeries,
		timeRange,
		setTimeRange,
		mitraPerformanceMetrics,
		requestCounts,
		recentRequests,
		recentTransactions,
		isLoadingRequests,
		isLoadingActivity,
		isLoading,
	};
}
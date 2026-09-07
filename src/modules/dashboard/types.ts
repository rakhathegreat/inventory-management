export type InventoryStats = {
  totalItems: number;
  tersedia: number;
  diluar: number;
  rusak: number;
  hilang: number;
};

export type SafetyStockAlert = {
  category: string;
  available: number;
  safetyStock: number;
  status: "Menipis" | "Habis";
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  date: string;
  isRead: boolean;
  generated?: boolean;
  targetUrl?: string;
  mitraName?: string;
  mitraType?: string;
};

export type ChartDataPoint = {
  date: string;
  masuk: number;
  keluar: number;
  rusak: number;
};

export type MitraPerformanceMetrics = {
  id: string;
  name: string;
  requestCount: number;
  totalItems: number;
  averageLifespanDays: number | null;
  daysSinceLastRequest: number;
  isIdleStock: boolean;
  status: 'Fast' | 'Steady' | 'Slow' | 'Idle' | 'Not Enough Data';
};

export type MitraDistributionItem = {
  mitra: string;
  tersedia: number;
  terpakai: number;
  total: number;
};

export type DailyTransactionPoint = {
  date: string;
  masuk: number;
  keluar: number;
};

/** Payload tunggal dari GET /dashboard/stats/summary */
export type DashboardSummary = {
  inventoryStats: InventoryStats;
  mitraDistribution: MitraDistributionItem[];
  requestCounts: { menunggu: number; siap: number };
  recentRequests: import("@/modules/transaksi/types").RequestSummary[];
  recentActivity: import("@/modules/transaksi/types").ActivityItem[];
  transactionSeries: DailyTransactionPoint[];
  mitraPerformance: MitraPerformanceMetrics[];
};

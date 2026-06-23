import { useCallback, useEffect, useRef, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import {
    SectionCards,
    type InventoryStats,
} from "@/components/section-cards"
import {
    SectionCharts,
    type SafetyStockAlert,
} from "@/components/section-charts"
import { useAuth } from "@/lib/auth"

type Transaction = {
    id: string;
    tanggal: string;
    nomor: string;
    kategori: string;
    status: string;
    sn: string;
    merek: string;
    asal: string | null;
    tujuan: string | null;
    mitra?: string | null;
    keterangan?: string | null;
};

type InventoryItem = {
    id: string
    status: string
    kategori: string
    mitra?: string | null
}

type Category = {
    name: string
    safetyStock: number
}

const DASHBOARD_TRANSACTION_LIMIT = 6
const DASHBOARD_REFRESH_INTERVAL = 5000

type DashboardTransaction = {
    id: string
    tanggal: string
    nomor: string
    kategori: string
    status: string
    sn: string
    merek: string
    asal: string
    tujuan: string
    mitra: string
    keterangan: string
}

export default function DashboardPage() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<DashboardTransaction[]>([])
    const [chartTransactions, setChartTransactions] = useState<Transaction[]>([])
    const [safetyStockAlerts, setSafetyStockAlerts] = useState<SafetyStockAlert[]>([])
    const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
        totalItems: 0,
        tersedia: 0,
        keluar: 0,
        rusak: 0,
    })
    const isFetchingRef = useRef(false)

    const fetchDashboardData = useCallback(async () => {
        if (isFetchingRef.current) return

        isFetchingRef.current = true
        try {
            const [transactionData, itemData, categoryData] = await Promise.all([
                invoke<Transaction[]>("get_transactions"),
                invoke<InventoryItem[]>("get_items"),
                invoke<Category[]>("get_categories"),
            ])
            const visibleTransactions = transactionData.filter(
                (transaction) =>
                    user?.role !== "mitra" ||
                    transaction.mitra?.trim().toLowerCase() ===
                        user.displayName.trim().toLowerCase()
            )
            const visibleItems = itemData.filter(
                (item) =>
                    user?.role !== "mitra" ||
                    item.mitra?.trim().toLowerCase() ===
                        user.displayName.trim().toLowerCase()
            )
            const flattened = visibleTransactions
                .slice(0, DASHBOARD_TRANSACTION_LIMIT)
                .map((transaction) => ({
                    id: transaction.id,
                    tanggal: transaction.tanggal,
                    nomor: transaction.nomor,
                    kategori: transaction.kategori,
                    status: transaction.status,
                    sn: transaction.sn,
                    merek: transaction.merek,
                    asal: transaction.asal || "-",
                    tujuan: transaction.tujuan || "-",
                    mitra: transaction.mitra || "-",
                    keterangan: transaction.keterangan || "-",
                }))
            setTransactions(flattened)
            setChartTransactions(visibleTransactions)
            setInventoryStats({
                totalItems: visibleItems.length,
                tersedia: visibleItems.filter(
                    (item) => item.status.trim().toLowerCase() === "masuk"
                ).length,
                keluar: visibleItems.filter(
                    (item) => item.status.trim().toLowerCase() === "keluar"
                ).length,
                rusak: visibleItems.filter(
                    (item) => item.status.trim().toLowerCase() === "rusak"
                ).length,
            })

            const availableByCategory = new Map<string, number>()
            const ownedCategories = new Set<string>()
            visibleItems.forEach((item) => {
                const categoryKey = item.kategori.trim().toLowerCase()
                ownedCategories.add(categoryKey)

                if (item.status.trim().toLowerCase() === "masuk") {
                    availableByCategory.set(
                        categoryKey,
                        (availableByCategory.get(categoryKey) || 0) + 1
                    )
                }
            })

            const relevantCategories = categoryData.filter(
                (category) =>
                    user?.role === "admin" ||
                    ownedCategories.has(category.name.trim().toLowerCase())
            )
            setSafetyStockAlerts(
                relevantCategories.flatMap<SafetyStockAlert>((category) => {
                    const available =
                        availableByCategory.get(category.name.trim().toLowerCase()) || 0
                    const safetyStock = Math.max(
                        0,
                        Number(category.safetyStock ?? 5)
                    )

                    if (available === 0) {
                        return [{
                            category: category.name,
                            available,
                            safetyStock,
                            status: "Habis" as const,
                        }]
                    }

                    if (available <= safetyStock) {
                        return [{
                            category: category.name,
                            available,
                            safetyStock,
                            status: "Menipis" as const,
                        }]
                    }

                    return []
                })
            )
        } catch (error) {
            console.error("Gagal mengambil data dashboard:", error)
        } finally {
            isFetchingRef.current = false
        }
    }, [user])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchDashboardData()
            }
        }

        fetchDashboardData()
        const refreshInterval = window.setInterval(
            fetchDashboardData,
            DASHBOARD_REFRESH_INTERVAL
        )

        window.addEventListener("focus", fetchDashboardData)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            window.clearInterval(refreshInterval)
            window.removeEventListener("focus", fetchDashboardData)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [fetchDashboardData])

    return (
        <div className="@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards
                stats={inventoryStats}
                totalLabel={
                    user?.role === "mitra"
                        ? "Total Barang Mitra"
                        : "Total Semua Barang"
                }
            />
            <SectionCharts
                isMitra={user?.role === "mitra"}
                displayName={user?.displayName}
                stats={inventoryStats}
                safetyStockAlerts={safetyStockAlerts}
            />
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive transactions={chartTransactions} />
            </div>
            <div className="px-4 lg:px-6">
                <DataTable
                    data={transactions}
                    showSelection={false}
                    showActions={false}
                    showPagination={false}
                />
            </div>
        </div>
    )
}

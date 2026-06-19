import { useCallback, useEffect, useRef, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SectionCharts } from "@/components/section-charts"

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
};

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
}

export default function DashboardPage() {
    const [transactions, setTransactions] = useState<DashboardTransaction[]>([])
    const isFetchingRef = useRef(false)

    const fetchTransactions = useCallback(async () => {
        if (isFetchingRef.current) return

        isFetchingRef.current = true
        try {
            const data = await invoke<Transaction[]>("get_transactions")
            const flattened = data
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
                }))
            setTransactions(flattened)
        } catch (error) {
            console.error("Gagal mengambil data transaksi:", error)
        } finally {
            isFetchingRef.current = false
        }
    }, [])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchTransactions()
            }
        }

        fetchTransactions()
        const refreshInterval = window.setInterval(
            fetchTransactions,
            DASHBOARD_REFRESH_INTERVAL
        )

        window.addEventListener("focus", fetchTransactions)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            window.clearInterval(refreshInterval)
            window.removeEventListener("focus", fetchTransactions)
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [fetchTransactions])

    return (
        <div className="@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <SectionCharts />
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
            </div>
            <div className="px-4 lg:px-6">
                <DataTable
                    data={transactions}
                    showSelection={false}
                    showPagination={false}
                />
            </div>
        </div>
    )
}

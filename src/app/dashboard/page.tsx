import { useEffect, useState } from "react"
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
};

const DASHBOARD_TRANSACTION_LIMIT = 6

export default function DashboardPage() {
    const [transactions, setTransactions] = useState<any[]>([])

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const data = await invoke<Transaction[]>("get_transactions")
                const flattened = data.slice(0, DASHBOARD_TRANSACTION_LIMIT).map((t) => ({
                    id: t.id,
                    tanggal: t.tanggal,
                    nomor: t.nomor,
                    kategori: t.kategori,
                    status: t.status,
                    sn: t.sn,
                    merek: t.merek,
                    asal: t.asal || "-",
                    tujuan: t.tujuan || "-",
                }))
                setTransactions(flattened)
            } catch (error) {
                console.error("Gagal mengambil data transaksi:", error)
            }
        }
        fetchTransactions()
    }, [])

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

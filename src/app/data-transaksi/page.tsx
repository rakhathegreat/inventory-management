import { DataTable } from "@/components/data-table"
import data from "../dashboard/data.json"

export default function DataTransaksiPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Data Transaksi
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan pantau seluruh transaksi barang masuk dan keluar yang tercatat di dalam sistem inventori.
          </p>
        </div>
      </div>
      <DataTable data={data} />
    </div>
  )
}


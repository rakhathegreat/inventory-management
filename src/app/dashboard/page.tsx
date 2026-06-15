import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import data from "./data.json"
import { SectionCharts } from "@/components/section-charts"

export default function DashboardPage() {
    return (
        <div className="@container/main flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <SectionCharts />
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
        </div>
    )
}

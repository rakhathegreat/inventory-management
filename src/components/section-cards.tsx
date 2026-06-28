import { Boxes, ArrowsUpFromLine, Archive, ArchiveX, HelpCircle } from "lucide-react"

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import type { InventoryStats } from "@/types/dashboard"

export function SectionCards({
    stats,
    totalLabel = "Total Barang",
}: {
    stats: InventoryStats
    totalLabel?: string
}) {
    const { totalItems, tersedia, diluar, rusak, hilang } = stats

    return (
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5 dark:*:data-[slot=card]:bg-card">
            <Card className="@container/card relative">
                <div className="flex flex-row items-center">
                    <div className="p-3 bg-primary/10 rounded-lg ml-4">
                        <Boxes className="text-primary" />
                    </div>
                    <div className="flex flex-col w-full ">
                        <CardHeader className="flex flex-col">
                            <CardDescription>{totalLabel}</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {totalItems} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                        </CardHeader>
                    </div>
                </div>
            </Card>
            <Card className="@container/card relative">
                <div className="flex flex-row items-center">
                    <div className="p-3 bg-primary/10 rounded-lg ml-4">
                        <Archive className="text-primary" />
                    </div>
                    <div className="flex flex-col w-full ">
                        <CardHeader className="flex flex-col">
                            <CardDescription>Tersedia</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {tersedia} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                        </CardHeader>
                    </div>
                </div>
            </Card>
            <Card className="@container/card relative">
                <div className="flex flex-row items-center">
                    <div className="p-3 bg-primary/10 rounded-lg ml-4">
                        <ArrowsUpFromLine className="text-primary" />
                    </div>
                    <div className="flex flex-col w-full ">
                        <CardHeader className="flex flex-col">
                            <CardDescription>Diluar</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {diluar} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                        </CardHeader>
                    </div>
                </div>
            </Card>
            <Card className="@container/card relative">
                <div className="flex flex-row items-center">
                    <div className="p-3 bg-primary/10 rounded-lg ml-4">
                        <ArchiveX className="text-primary" />
                    </div>
                    <div className="flex flex-col w-full ">
                        <CardHeader className="flex flex-col">
                            <CardDescription>Rusak</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {rusak} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                        </CardHeader>
                    </div>
                </div>
            </Card>
            <Card className="@container/card relative">
                <div className="flex flex-row items-center">
                    <div className="p-3 bg-primary/10 rounded-lg ml-4">
                        <HelpCircle className="text-primary" />
                    </div>
                    <div className="flex flex-col w-full ">
                        <CardHeader className="flex flex-col">
                            <CardDescription>Hilang</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {hilang} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                        </CardHeader>
                    </div>
                </div>
            </Card>
        </div>
    )
}

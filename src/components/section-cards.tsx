import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { Boxes, ArrowsUpFromLine, Archive, ArchiveX } from "lucide-react"

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
    const [totalItems, setTotalItems] = useState(0)
    const [tersedia, setTersedia] = useState(0)
    const [keluar, setKeluar] = useState(0)
    const [rusak, setRusak] = useState(0)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const items = await invoke<any[]>("get_items")
                setTotalItems(items.length)
                setTersedia(items.filter((i) => i.status === "Masuk").length)
                setKeluar(items.filter((i) => i.status === "Keluar").length)
                setRusak(items.filter((i) => i.status === "Rusak").length)
            } catch (error) {
                console.error("Gagal mengambil data items:", error)
            }
        }
        fetchStats()
    }, [])

    return (
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
            <Card className="@container/card relative">
                <div className="flex flex-row items-center">
                    <div className="p-3 bg-primary/10 rounded-lg ml-4">
                        <Boxes className="text-primary" />
                    </div>
                    <div className="flex flex-col w-full ">
                        <CardHeader className="flex flex-col">
                            <CardDescription>Total</CardDescription>
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
                            <CardDescription>Keluar</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {keluar} <span className="text-sm font-normal text-muted-foreground">Unit</span>
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
        </div>
    )
}

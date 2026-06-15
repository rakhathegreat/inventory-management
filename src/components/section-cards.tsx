import { TrendingDown, TrendingUp, Boxes, ArrowsUpFromLine, Archive, ArchiveX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
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
                                145 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                            <CardAction className="absolute top-4 right-4">
                                <Badge variant="outline">
                                    <TrendingUp />
                                    +12.5%
                                </Badge>
                            </CardAction>
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
                                100 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                            <CardAction className="absolute top-4 right-4">
                                <Badge variant="outline">
                                    <TrendingDown />
                                    -20%
                                </Badge>
                            </CardAction>
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
                                25 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                            <CardAction className="absolute top-4 right-4">
                                <Badge variant="outline">
                                    <TrendingUp />
                                    +12.5%
                                </Badge>
                            </CardAction>
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
                                4 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                            </CardTitle>
                            <CardAction className="absolute top-4 right-4">
                                <Badge variant="outline">
                                    <TrendingUp />
                                    +4.5%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                    </div>
                </div>
            </Card>
        </div>
    )
}

import { TrendingDown, TrendingUp } from "lucide-react"

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
        <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Total Barang</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        145 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingUp />
                            +12.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Tersedia</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        100 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingDown />
                            -20%
                        </Badge>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Keluar</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        25 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingUp />
                            +12.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
            </Card>
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Rusak</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        4 <span className="text-sm font-normal text-muted-foreground">Unit</span>
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <TrendingUp />
                            +4.5%
                        </Badge>
                    </CardAction>
                </CardHeader>
            </Card>
        </div>
    )
}

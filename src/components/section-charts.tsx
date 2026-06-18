"use client"

import * as React from "react"
import { invoke } from "@tauri-apps/api/core"
import { ArrowRight, BadgeCheck, Check, Info, AlertTriangle, PackagePlus, PackageMinus, Lightbulb, X } from "lucide-react"
import { Link } from "react-router-dom"

import {
    Label,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    type ChartConfig,
} from "@/components/ui/chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const chartConfig = {
    visitors: {
        label: "Terisi",
    },
    safari: {
        label: "Terisi",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

type NotificationItem = {
    id: string
    title: string
    message: string
    type: string
    date: string
    isRead: boolean
}

export function SectionCharts() {
    const [items, setItems] = React.useState<NotificationItem[]>([])

    const fetchNotifications = React.useCallback(async () => {
        try {
            const data = await invoke<NotificationItem[]>("get_notifications")
            setItems(data)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        }
    }, [])

    React.useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 10000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const unreadCount = items.filter((n) => !n.isRead).length

    // Storage capacity from DB
    const [totalCapacity, setTotalCapacity] = React.useState(0)
    const [usedCapacity, setUsedCapacity] = React.useState(0)
    const capacityPercent = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0
    const remaining = totalCapacity - usedCapacity

    const chartData = React.useMemo(() => [
        { browser: "safari", visitors: capacityPercent, fill: "var(--color-safari)" },
    ], [capacityPercent])

    React.useEffect(() => {
        const fetchCapacity = async () => {
            try {
                const locations = await invoke<any[]>("get_locations")
                let total = 0
                let used = 0
                for (const loc of locations) {
                    if (loc.type === "Rak" && loc.levels) {
                        for (const lvl of loc.levels) {
                            total += lvl.capacity || 0
                            used += lvl.usedCapacity || 0
                        }
                    } else {
                        total += loc.capacity || 0
                        used += loc.usedCapacity || 0
                    }
                }
                setTotalCapacity(total)
                setUsedCapacity(used)
            } catch (error) {
                console.error("Gagal mengambil data kapasitas:", error)
            }
        }
        fetchCapacity()
    }, [])

    const markAsRead = async (id: string) => {
        try {
            await invoke("mark_notification_read", { id })
            fetchNotifications()
        } catch (error) {
            console.error("Failed to mark as read:", error)
        }
    }

    const markAllAsRead = async (e: React.MouseEvent) => {
        e.preventDefault()
        try {
            await invoke("mark_all_notifications_read")
            fetchNotifications()
        } catch (error) {
            console.error("Failed to mark all as read:", error)
        }
    }

    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        try {
            await invoke("delete_notification", { id })
            fetchNotifications()
        } catch (error) {
            console.error("Failed to delete notification:", error)
        }
    }

    const getIconProps = (type: string) => {
        switch (type) {
            case "warning":
                return { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" }
            case "success":
                return { icon: Check, color: "text-emerald-500", bg: "bg-emerald-500/10" }
            case "error":
                return { icon: X, color: "text-red-600", bg: "bg-red-600/10" }
            case "info":
            default:
                return { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" }
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 lg:px-6">
            {/* Card 1 */}
            <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Kapasitas Penyimpanan</CardTitle>
                    <CardDescription>January - June 2024</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square w-full max-w-[250px]"
                        initialDimension={{ width: 250, height: 250 }}
                    >
                        <RadialBarChart
                            data={chartData}
                            startAngle={90}
                            endAngle={-270}
                            outerRadius={90}
                            innerRadius={80}
                        >
                            <PolarGrid
                                gridType="circle"
                                radialLines={false}
                                stroke="none"
                                className="first:fill-muted last:fill-background"
                                polarRadius={[90, 80]}
                            />
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar dataKey="visitors" background cornerRadius={10} isAnimationActive={false} />
                            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-4xl font-bold"
                                                    >
                                                        {capacityPercent}%
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 24}
                                                        className="fill-muted-foreground"
                                                    >
                                                        Terisi
                                                    </tspan>
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </PolarRadiusAxis>
                        </RadialBarChart>
                    </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm bg-card mt-auto">
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <div className="flex flex-col text-center">
                            <p className="text-muted-foreground font-normal text-xs">Kapasitas</p>
                            <p className="font-bold text-md">{totalCapacity}</p>
                        </div>
                        <div className="flex flex-col text-center">
                            <p className="text-muted-foreground font-normal text-xs">Digunakan</p>
                            <p className="font-bold text-md">{usedCapacity}</p>
                        </div>
                        <div className="flex flex-col text-center">
                            <p className="text-muted-foreground font-normal text-xs">Tersisa</p>
                            <p className="font-bold text-md">{remaining}</p>
                        </div>
                    </div>
                </CardFooter>
            </Card>

            {/* Card 2 */}
            <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle>Notifikasi</CardTitle>
                        <CardDescription>Pembaruan sistem & stok</CardDescription>
                    </div>
                    {unreadCount > 0 && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {unreadCount} baru
                        </span>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pb-0 px-0">
                    <ScrollArea className="h-[260px] w-full px-4">
                        <div className="flex flex-col gap-1 py-2 h-full">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full pt-16 text-center gap-2">
                                    <BadgeCheck strokeWidth={1.5} className="text-muted-foreground/40 h-10 w-10 mx-auto" />
                                    <p className="text-muted-foreground/60 text-sm">Tidak ada notifikasi baru.</p>
                                </div>
                            ) : items.map((notification) => {
                                const { icon: Icon, color, bg } = getIconProps(notification.type)
                                return (
                                    <button
                                        key={notification.id}
                                        onClick={() => markAsRead(notification.id)}
                                        className={cn(
                                            "group flex items-start gap-3 rounded-lg p-3 text-left transition-all hover:bg-accent focus:bg-accent outline-none relative",
                                            !notification.isRead && "bg-muted/40"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex size-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                                                bg,
                                                color
                                            )}
                                        >
                                            <Icon className="size-4" />
                                        </div>
                                        <div className="flex flex-col gap-1 pr-6">
                                            <p
                                                className={cn(
                                                    "text-sm leading-tight text-foreground",
                                                    !notification.isRead ? "font-semibold" : "font-medium"
                                                )}
                                            >
                                                {notification.title}
                                            </p>
                                            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] font-medium text-muted-foreground/60 mt-0.5">
                                                {formatTime(notification.date)}
                                            </p>
                                        </div>
                                        <div className="absolute right-3 top-3 flex flex-col items-end gap-2 h-full justify-between pb-4">
                                            {!notification.isRead ? (
                                                <div className="flex size-2 shrink-0 rounded-full bg-primary" />
                                            ) : (
                                                <div className="flex size-2 shrink-0 opacity-0" />
                                            )}
                                            <div
                                                onClick={(e) => deleteNotification(e, notification.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted-foreground/20 rounded-md text-muted-foreground hover:text-foreground cursor-pointer -mr-1"
                                                title="Hapus notifikasi"
                                            >
                                                <X className="size-3.5" />
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm border-t-0 bg-card items-end mt-auto pt-4">
                    <div className="flex items-center gap-2 leading-none font-medium w-full justify-between">
                        <button onClick={markAllAsRead} className="text-muted-foreground hover:text-foreground transition-colors px-2">
                            Tandai semua dibaca
                        </button>
                        <a className="flex items-center gap-2 px-2" href="#">Lihat Semua <ArrowRight className="h-4 w-4" /></a>
                    </div>
                </CardFooter>
            </Card>

            {/* Card 3 */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle>Aktivitas Cepat</CardTitle>
                    <CardDescription>Pintasan ke fitur utama</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-top gap-2">
                    <Button asChild size="lg" variant="secondary" className="w-full gap-2 text-md h-12 cursor-pointer">
                        <Link to="/barang-masuk">
                            <PackagePlus className="size-5" />
                            Catat Barang Masuk
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="w-full gap-2 text-md h-12 border cursor-pointer">
                        <Link to="/barang-keluar">
                            <PackageMinus className="size-5" />
                            Catat Barang Keluar
                        </Link>
                    </Button>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm bg-muted/20 mt-auto pt-4 rounded-b-xl border-t">
                    <div className="flex items-start gap-2 text-muted-foreground w-full">
                        <Lightbulb className="size-4 text-amber-500 mt-0.5 shrink-0" />
                        <span className="leading-relaxed text-xs">
                            <strong className="font-semibold text-foreground">Tips:</strong> Pastikan Anda mencatat setiap mutasi barang secara <i>real-time</i> agar stok selalu akurat.
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

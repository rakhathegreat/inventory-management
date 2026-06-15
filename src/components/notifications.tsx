"use client"

import * as React from "react"
import { Bell, Check, Info, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const notifications = [
  {
    id: 1,
    title: "Stok Barang Menipis",
    description: "Stok Kabel UTP Cat6 sisa 5 roll. Segera restock.",
    time: "2 jam yang lalu",
    icon: AlertTriangle,
    read: false,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: 2,
    title: "Barang Masuk Berhasil",
    description: "100 unit Router Mikrotik RB750Gr3 telah ditambahkan.",
    time: "5 jam yang lalu",
    icon: Check,
    read: false,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: 3,
    title: "Pembaruan Sistem",
    description: "Sistem akan maintenance pada pukul 00:00 WIB.",
    time: "1 hari yang lalu",
    icon: Info,
    read: true,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: 4,
    title: "Barang Keluar",
    description: "50 unit ONT ZTE F609 telah dikeluarkan untuk teknisi Budi.",
    time: "1 hari yang lalu",
    icon: Check,
    read: true,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: 5,
    title: "Laporan Mingguan Siap",
    description: "Laporan mutasi barang minggu ke-2 telah di-generate.",
    time: "2 hari yang lalu",
    icon: Info,
    read: true,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
]

export function Notifications() {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState(notifications)
  const unreadCount = items.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setItems(items.map((item) => ({ ...item, read: true })))
  }

  const markAsRead = (id: number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, read: true } : item)))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group rounded-full">
          <Bell className="size-[1.15rem] text-muted-foreground transition-all group-hover:text-foreground group-hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 md:w-[380px]" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">Notifikasi</p>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {unreadCount} baru
              </span>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="flex flex-col gap-1 p-2">
            {items.map((notification) => (
              <button
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 text-left transition-all hover:bg-accent focus:bg-accent outline-none",
                  !notification.read && "bg-muted/40"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full mt-0.5",
                    notification.bg,
                    notification.color
                  )}
                >
                  <notification.icon className="size-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                  <p
                    className={cn(
                      "text-sm leading-tight text-foreground",
                      !notification.read ? "font-semibold" : "font-medium"
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {notification.description}
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground/60 mt-1">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <div className="ml-auto mt-1 flex size-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
        {unreadCount > 0 && (
          <div className="border-t p-2">
            <Button 
              variant="ghost" 
              onClick={markAllAsRead}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground h-9"
            >
              Tandai semua sudah dibaca
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

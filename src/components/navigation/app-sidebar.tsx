"use client"

import * as React from "react"

import { NavMain } from "@/components/navigation/nav-main"
import { NavProjects } from "@/components/navigation/nav-projects"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  CircleStar,
  Database,
  Handshake,
  HistoryIcon,
  LayoutGrid,
  MapPinHouse,
  PackageMinus,
  PackagePlus,
  Shapes,
  Zap,
} from "lucide-react"
import { useAuth } from "@/lib/auth"

const data = {
  navMain: [
    {
      title: "Operasional",
      items: [
        {
          title: "Barang Masuk",
          url: "/barang-masuk",
          icon: (
            <PackagePlus />
          ),
          isActive: false,
        },
        {
          title: "Barang Keluar",
          url: "/barang-keluar",
          icon: (
            <PackageMinus />
          ),
          isActive: false,
        },
        {
          title: "Riwayat",
          url: "/riwayat",
          icon: (
            <HistoryIcon />
          ),
          isActive: false,
        },
      ],
    },
    {
      title: "Inventori",
      items: [
        {
          title: "Data Barang",
          url: "/data-barang",
          icon: (
            <Database />
          ),
          isActive: false,
        }
      ],
    },
    {
      title: "Manajemen Data",
      items: [
        {
          title: "Lokasi Barang",
          url: "/lokasi-barang",
          icon: (
            <MapPinHouse />
          ),
          isActive: false,
        },
        {
          title: "Kategori Barang",
          url: "/kategori-barang",
          icon: (
            <Shapes />
          ),
          isActive: false,
        },
        {
          title: "Merek Barang",
          url: "/merek-barang",
          icon: (
            <CircleStar />
          ),
          isActive: false,
        },
        {
          title: "Mitra",
          url: "/mitra",
          icon: (
            <Handshake />
          ),
          isActive: false,
        }
      ],
    },
  ],
  main: [
    {
      name: "Dashboard",
      url: "/",
      icon: (
        <LayoutGrid
        />
      ),
      isActive: true,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const mitraAllowedUrls = new Set([
    "/barang-masuk",
    "/barang-keluar",
    "/riwayat",
    "/data-barang",
    "/lokasi-barang",
  ])
  const visibleNavMain = isAdmin
    ? data.navMain
    : data.navMain
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => mitraAllowedUrls.has(item.url)),
        }))
        .filter((group) => group.items.length > 0)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Arxiva Inventory"
              className="pointer-events-none"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="size-4" fill="currentColor" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Arxiva</span>
                <span className="truncate text-xs">Inventory Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects main={data.main} />
        <NavMain items={visibleNavMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

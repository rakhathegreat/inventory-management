"use client"

import * as React from "react"

import { NavMain } from "@/shared/layout/navigation/nav-main"
import { NavProjects } from "@/shared/layout/navigation/nav-projects"
import { useAuth } from "@/modules/auth/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar"
import {
  Database,
  FolderCog,
  HistoryIcon,
  LayoutGrid,
  MapPinHouse,
  PackagePlus,
  Settings,
  Users,
  Zap,
  ArrowLeftRight,
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Operasional",
      items: [
        {
          title: "Material Masuk",
          url: "/barang-masuk",
          icon: (
            <PackagePlus />
          ),
          isActive: false,
        },
        {
          title: "Request",
          url: "/request",
          icon: (
            <HistoryIcon />
          ),
          isActive: false,
        },
        {
          title: "Peminjaman Antar Mitra",
          url: "/peminjaman-mitra",
          icon: (
            <ArrowLeftRight />
          ),
          isActive: false,
        },
      ],
    },
    {
      title: "Inventori",
      items: [
        {
          title: "Data Material",
          url: "/data-barang",
          icon: (
            <Database />
          ),
          isActive: false,
        },
        {
          title: "Lokasi Material",
          url: "/lokasi-barang",
          icon: (
            <MapPinHouse />
          ),
          isActive: false,
        }
      ],
    },
    {
      title: "Manajemen Data",
      items: [
        {
          title: "Manajemen Data",
          url: "/manajemen-data",
          icon: (
            <FolderCog />
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
      adminOnly: false,
    },
    {
      name: "Pengaturan",
      url: "/pengaturan",
      icon: (
        <Settings
        />
      ),
      isActive: true,
      adminOnly: false,
    },
    {
      name: "Manajemen User",
      url: "/manajemen-user",
      icon: (
        <Users
        />
      ),
      isActive: true,
      adminOnly: true,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const mainItems = data.main.filter((item) => !item.adminOnly || user?.role === "admin");

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
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-yellow-300">
                <Zap className="size-4" fill="currentColor" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">PT ICON Plus Tasikmalaya</span>
                <span className="truncate text-xs">Inventory Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects main={mainItems} />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

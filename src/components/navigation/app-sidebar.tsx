"use client"

import * as React from "react"

import { NavMain } from "@/components/navigation/nav-main"
import { NavProjects } from "@/components/navigation/nav-projects"
import { TeamSwitcher } from "@/components/navigation/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { AudioLinesIcon, TerminalIcon, HistoryIcon, LayoutGrid, Database, MapPinHouse, Shapes, CircleStar, PackagePlus, PackageMinus, Zap } from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "ICON Plus Tasikmalaya",
      logo: (
        <Zap className="text-yellow-300" fill="currentColor" />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects main={data.main} />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

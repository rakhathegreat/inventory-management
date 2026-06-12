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
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon } from "lucide-react"

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
        <GalleryVerticalEndIcon
        />
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
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "Barang Masuk",
          url: "#",
        },
        {
          title: "Barang Keluar",
          url: "#",
        },
        {
          title: "Riwayat",
          url: "#",
        },
      ],
    },
    {
      title: "Inventori",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Data Barang",
          url: "#",
        },
        {
          title: "Stok Barang",
          url: "#",
        }
      ],
    },
    {
      title: "Pengaturan",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
      items: [
        {
          title: "Lokasi",
          url: "#",
        },
        {
          title: "Kategori",
          url: "#",
        },
        {
          title: "Merek",
          url: "#",
        },
        {
          title: "Supplier",
          url: "#",
        },
      ],
    },
  ],
  main: [
    {
      name: "Dashboard",
      url: "#",
      icon: (
        <TerminalSquareIcon
        />
      ),
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

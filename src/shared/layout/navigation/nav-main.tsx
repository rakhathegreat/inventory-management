import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/shared/ui/sidebar"
import { useLocation, Link } from "react-router-dom"
import React from "react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    items: {
      title: string
      url: string
      icon: React.ReactNode
    }[]
  }[]
}) {
  const location = useLocation()

  return (
    <SidebarGroup>
      {items.map((item) => (
        <div className="mb-4" key={item.title}>
          <SidebarGroupLabel>{item.title}</SidebarGroupLabel>

          <SidebarMenu>
            {item.items.map((subItem) => {
              const pathname = location.pathname
              const active =
                pathname === subItem.url || pathname.startsWith(`${subItem.url}/`)
              return (
                <SidebarMenuItem key={subItem.title}>
                  <SidebarMenuButton asChild isActive={active} tooltip={subItem.title}>
                    <Link to={subItem.url}>
                      {subItem.icon}
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </div>
      ))}
    </SidebarGroup>
  )
}

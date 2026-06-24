import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"

export function SiteHeader() {
    const location = useLocation()
    const { user } = useAuth()
    const path = location.pathname
    const userBadgeLabel =
        user?.role === "admin" ? user?.identityCode || "Admin" : "Mitra"

    // Determine breadcrumbs based on route
    let parent = "Menu Utama"
    let pageName = "Dashboard"

    if (path === "/barang-masuk") {
        parent = "Operasional"
        pageName = "Barang Masuk"
    } else if (path === "/barang-keluar") {
        parent = "Operasional"
        pageName = "Barang Keluar"
    } else if (path === "/riwayat") {
        parent = "Operasional"
        pageName = "Riwayat"
    } else if (path === "/data-barang") {
        parent = "Inventori"
        pageName = "Data Barang"
    } else if (path === "/data-transaksi") {
        parent = "Inventori"
        pageName = "Data Transaksi"
    } else if (path === "/lokasi-barang") {
        parent = "Manajemen Data"
        pageName = "Lokasi Barang"
    } else if (path === "/kategori-barang") {
        parent = "Manajemen Data"
        pageName = "Kategori Barang"
    } else if (path === "/merek-barang") {
        parent = "Manajemen Data"
        pageName = "Merek Barang"
    } else if (path === "/mitra") {
        parent = "Manajemen Data"
        pageName = "Mitra"
    }

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <Breadcrumb className="flex-1">
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="#">
                                {parent}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{pageName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    )
}

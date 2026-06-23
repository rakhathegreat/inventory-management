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
import { LogOut } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SiteHeader() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
    const path = location.pathname

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

    const handleLogout = () => {
        logout()
        setIsLogoutDialogOpen(false)
        navigate("/login", { replace: true })
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
                <div className="hidden items-center gap-2 sm:flex">
                    <div className="text-right leading-tight">
                        <p className="max-w-40 truncate text-sm font-medium">
                            {user?.displayName}
                        </p>
                        <p className="max-w-40 truncate text-xs text-muted-foreground">
                            @{user?.username}
                        </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                        {user?.identityCode || user?.role}
                    </Badge>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsLogoutDialogOpen(true)}
                    aria-label="Keluar dari akun"
                    title="Keluar"
                >
                    <LogOut className="size-4" />
                </Button>
            </div>

            <AlertDialog
                open={isLogoutDialogOpen}
                onOpenChange={setIsLogoutDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi logout</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin keluar dari akun {user?.displayName}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout}>
                            <LogOut className="size-4" />
                            Ya, Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </header>
    )
}

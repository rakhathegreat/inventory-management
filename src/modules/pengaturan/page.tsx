import { useState } from "react"
import { useAuth } from "@/modules/auth/auth"
import { ProfileTab } from "./components/ProfileTab"
import { SecurityTab } from "./components/SecurityTab"
import { SignatureTab } from "./components/SignatureTab"
import { GoogleDriveTab } from "./components/GoogleDriveTab"
import { SidebarNav } from "./components/SidebarNav"

/**
 * Komponen PengaturanPage
 *
 * Halaman pengaturan global aplikasi (Profil, Keamanan, Tanda Tangan Digital,
 * Google Drive — admin only). Integrasi Google/Drive dipakai khusus untuk
 * membuat spreadsheet & QR code lokasi material.
 */
export default function PengaturanPage() {
  const { user } = useAuth()
  const isAdmin = user?.role?.toLowerCase() === "admin"

  // Active Category State for Sidebar Navigation
  const [activeCategory, setActiveCategory] = useState("profil")

  const sidebarGroups = [
    {
      groupLabel: "Pengaturan Akun",
      items: [
        {
          title: "Profil",
          id: "profil"
        },
        {
          title: "Keamanan",
          id: "keamanan"
        },
        {
          title: "Tanda Tangan Digital",
          id: "ttd-digital"
        }
      ]
    },
    {
      groupLabel: "Integrasi",
      items: [
        {
          title: "Google Drive",
          id: "google-drive",
          adminOnly: true
        }
      ]
    }
  ]

  return (
    <div className="@container/main flex h-full select-none flex-col gap-6 w-full mx-auto overflow-hidden">
      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row lg:space-y-0 flex-1 overflow-hidden">
        <aside className="lg:w-1/5 shrink-0 overflow-y-auto pb-10 border-r">
          <div className="border-b px-6 py-3">
            <span className="text-md font-medium">Settings</span>
          </div>
          <SidebarNav
            groups={sidebarGroups}
            activeId={activeCategory}
            onSelect={setActiveCategory}
            isAdmin={isAdmin}
          />
        </aside>

        <div className="flex-1 w-full overflow-y-auto pb-10 px-8">
          {activeCategory === "profil" && (
            <div className="flex flex-col gap-6">
              <ProfileTab />
            </div>
          )}

          {activeCategory === "keamanan" && (
            <div className="flex flex-col gap-6">
              <SecurityTab />
            </div>
          )}

          {activeCategory === "ttd-digital" && (
            <div className="flex flex-col gap-6">
              <SignatureTab />
            </div>
          )}

          {activeCategory === "google-drive" && (
            <div className="flex flex-col gap-6">
              <GoogleDriveTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

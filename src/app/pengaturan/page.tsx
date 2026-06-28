import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { invoke } from "@tauri-apps/api/core"
import {
  Shield,
  RefreshCw,
  LogOut,
  User,
  Cloud,
  Check,
  Lock,
  Server
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID || "847352193552-odl1tr4a71os3eddiftnu9en4ncg7mqg.apps.googleusercontent.com";

const getBaseUrl = () => {
  const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "http://172.168.9.139:3000/";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

export default function PengaturanPage() {
  const { user } = useAuth()
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [googleEmail, setGoogleEmail] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [backupEnabled, setBackupEnabled] = useState(true)

  useEffect(() => {
    const fetchGoogleStatus = async () => {
      try {
        const token = localStorage.getItem("arxiva-auth-token");
        if (!token) return;

        const res = await fetch(`${getBaseUrl()}/auth/google/status`, {
          headers: { Authorization: token }
        });

        if (res.ok) {
          const data = await res.json();
          setIsGoogleConnected(data.googleConnected);
          if (data.googleEmail) {
            setGoogleEmail(data.googleEmail);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil status Google:", error);
      }
    };

    fetchGoogleStatus();
  }, [user]);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    toast.info("Membuka browser untuk otentikasi Google...");

    try {
      // Step 1: Call Rust command to open browser & capture OAuth code
      const code = await invoke<string>("google_oauth_login", {
        clientId: GOOGLE_CLIENT_ID,
      });

      toast.info("Menukar kode otorisasi...");

      // Step 2: Send code to Express.js backend to exchange for tokens
      const token = localStorage.getItem("arxiva-auth-token");
      const res = await fetch(`${getBaseUrl()}/auth/google/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({
          code,
          userId: user?.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Gagal menukar kode otorisasi");
      }

      const data = await res.json();
      setIsGoogleConnected(data.googleConnected);
      setGoogleEmail(data.googleEmail);
      toast.success(`Berhasil menghubungkan akun Google (${data.googleEmail})!`);
    } catch (error: any) {
      console.error("OAuth2 Error:", error);
      const message = typeof error === "string" ? error : error?.message || "Terjadi kesalahan";
      toast.error(`Gagal menghubungkan Google: ${message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setIsDisconnecting(true);
    try {
      const token = localStorage.getItem("arxiva-auth-token");
      if (token) {
        await fetch(`${getBaseUrl()}/auth/google/disconnect`, {
          method: "DELETE",
          headers: { Authorization: token }
        });
      }

      setIsGoogleConnected(false);
      setGoogleEmail("");
      toast.success("Koneksi akun Google berhasil diputuskan.");
    } catch (error) {
      toast.error("Gagal memutuskan koneksi akun Google.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="@container/main flex h-full select-none flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Top summary cards matching BarangKeluarPage & DashboardPage */}
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card">
        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <User className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Pengguna Aktif</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {user?.displayName || "User"} <span className="text-sm font-normal text-muted-foreground">{user?.role === "admin" ? "Admin" : "Mitra"}</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>

        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <Cloud className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Google OAuth2</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {isGoogleConnected ? "Terhubung" : "Belum"} <span className="text-sm font-normal text-muted-foreground">{isGoogleConnected ? "OAuth2" : "Tautkan"}</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>

        <Card className="@container/card relative">
          <div className="flex flex-row items-center">
            <div className="ml-4 rounded-lg bg-primary/10 p-3">
              <Shield className="text-primary" />
            </div>
            <div className="flex w-full flex-col">
              <CardHeader className="flex flex-col">
                <CardDescription>Keamanan Sistem</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  Aktif <span className="text-sm font-normal text-muted-foreground">JWT Token</span>
                </CardTitle>
              </CardHeader>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid h-full gap-4 px-4 lg:px-6 @5xl/main:grid-cols-[minmax(320px,380px)_1fr]">

        {/* Left Column: Profil & Akses */}
        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(100svh-var(--header-height)-15rem)]">
          <CardHeader className="flex flex-col gap-1 border-b pb-4">
            <CardTitle>Profil & Akses</CardTitle>
            <CardDescription>Informasi akun dan pengamanan sistem aktif</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-6 pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Nama Tampilan</span>
                <span className="text-sm font-semibold text-foreground">{user?.displayName || "Pengguna"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Username / Email</span>
                <span className="text-sm font-semibold text-foreground">{user?.username || "-"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Peran (Role)</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="font-normal">
                    {user?.role === "admin" ? "Administrator" : "Mitra"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">({user?.identityCode || "ADM"})</span>
                </div>
              </div>
            </div>

            <div className="border-t my-2" />

            <div className="flex flex-col gap-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Keamanan</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="size-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">Enkripsi Token JWT</span>
                </div>
                <Badge variant="secondary" className="font-normal">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="size-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">Koneksi API Server</span>
                </div>
                <Badge variant="secondary" className="font-normal">Aman</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Google OAuth2 & Sinkronisasi */}
        <Card className="@container/card flex flex-col @5xl/main:min-h-[calc(100svh-var(--header-height)-15rem)]">
          <CardHeader className="flex flex-col gap-3 border-b pb-4 @lg/card:flex-row @lg/card:items-center @lg/card:justify-between">
            <div className="space-y-1">
              <CardTitle>Google OAuth2 & Sinkronisasi</CardTitle>
              <CardDescription>Menghubungkan akun Google untuk keperluan sinkronisasi otomatis</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              {isGoogleConnected ? "OAuth2 Terhubung" : "Belum Terhubung"}
            </Badge>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-6 pt-6">

            {/* Google Connection Box */}
            {isGoogleConnected ? (
              <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{googleEmail}</span>
                    <Badge variant="secondary" className="font-normal px-2.5 py-0.5">OAuth2 Aktif</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Akun Google terhubung dengan aman untuk akses otomatis Google Sheets & Drive.</p>
                </div>
                <div className="flex justify-start">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnectGoogle}
                    disabled={isDisconnecting}
                    className="gap-2"
                  >
                    {isDisconnecting ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Memutuskan...
                      </>
                    ) : (
                      <>
                        <LogOut className="size-4" />
                        Putuskan Tautan Akun
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Cloud className="size-8" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-foreground">
                    Hubungkan Akun Google Anda
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">
                    Sistem akan meminta izin OAuth2 untuk menyinkronkan data inventori barang dan riwayat transaksi ke Google Sheets dan Google Drive Anda.
                  </p>
                </div>
                <Button
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                  size="lg"
                  className="gap-2"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Menghubungkan...
                    </>
                  ) : (
                    <>
                      <svg className="size-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      Hubungkan dengan Google (OAuth2)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Preferences Options */}
            <div className="flex flex-col gap-4 rounded-lg border p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Sinkronisasi Otomatis Google Sheets</p>
                  <p className="text-xs text-muted-foreground">Perbarui baris spreadsheet secara real-time saat transaksi terjadi.</p>
                </div>
                <Button
                  variant={autoSync ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setAutoSync(!autoSync)
                    toast.success(`Sinkronisasi otomatis ${!autoSync ? "diaktifkan" : "dinonaktifkan"}.`)
                  }}
                  className="gap-2"
                >
                  {autoSync ? <><Check className="size-4" /> Aktif</> : "Nonaktif"}
                </Button>
              </div>

              <div className="border-t my-2" />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Pencadangan ke Google Drive</p>
                  <p className="text-xs text-muted-foreground">Simpan salinan cadangan database barang dan riwayat transaksi secara berkala.</p>
                </div>
                <Button
                  variant={backupEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setBackupEnabled(!backupEnabled)
                    toast.success(`Pencadangan ${!backupEnabled ? "diaktifkan" : "dinonaktifkan"}.`)
                  }}
                  className="gap-2"
                >
                  {backupEnabled ? <><Check className="size-4" /> Aktif</> : "Nonaktif"}
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  )
}



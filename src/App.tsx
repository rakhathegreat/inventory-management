import "./App.css";
import {
  HashRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { ThemeProvider } from "./components/themeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/layout";
import DashboardPage from "./app/dashboard/page";
import BarangMasukPage from "./app/barang-masuk/page";
import BarangKeluarPage from "./app/barang-keluar/page";
import DataBarangPage from "./app/data-barang/page";
import DataTransaksiPage from "./app/data-transaksi/page";
import LokasiBarangPage from "./app/lokasi-barang/page";
import KategoriBarangPage from "./app/kategori-barang/page";
import MerekBarangPage from "./app/merek-barang/page";
import MitraPage from "./app/mitra/page";
import LoginPage from "./app/login/page";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";

function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable right-click globally
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route
                  path="barang-masuk"
                  element={<BarangMasukPage />}
                />
                <Route
                  path="barang-keluar"
                  element={<BarangKeluarPage />}
                />
                <Route
                  path="riwayat"
                  element={<DataTransaksiPage />}
                />
                <Route
                  path="data-barang"
                  element={<DataBarangPage />}
                />
                <Route
                  path="lokasi-barang"
                  element={
                    <ProtectedRoute adminOnly>
                      <LokasiBarangPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="kategori-barang"
                  element={
                    <ProtectedRoute adminOnly>
                      <KategoriBarangPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="merek-barang"
                  element={
                    <ProtectedRoute adminOnly>
                      <MerekBarangPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="mitra"
                  element={
                    <ProtectedRoute adminOnly>
                      <MitraPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </TooltipProvider>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;

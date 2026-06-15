import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/themeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/layout";
import DashboardPage from "./app/dashboard/page";
import BarangMasukPage from "./app/barang-masuk/page";
import BarangKeluarPage from "./app/barang-keluar/page";
import RiwayatPage from "./app/riwayat/page";
import DataBarangPage from "./app/data-barang/page";
import StokBarangPage from "./app/stok-barang/page";
import LokasiBarangPage from "./app/lokasi-barang/page";
import KategoriBarangPage from "./app/kategori-barang/page";
import MerekBarangPage from "./app/merek-barang/page";
import SupplierPage from "./app/supplier/page";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="barang-masuk" element={<BarangMasukPage />} />
              <Route path="barang-keluar" element={<BarangKeluarPage />} />
              <Route path="riwayat" element={<RiwayatPage />} />
              <Route path="data-barang" element={<DataBarangPage />} />
              <Route path="stok-barang" element={<StokBarangPage />} />
              <Route path="lokasi-barang" element={<LokasiBarangPage />} />
              <Route path="kategori-barang" element={<KategoriBarangPage />} />
              <Route path="merek-barang" element={<MerekBarangPage />} />
              <Route path="supplier" element={<SupplierPage />} />
            </Route>
          </Routes>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;

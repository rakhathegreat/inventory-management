import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/modules/auth/ProtectedRoute";
import AdminRoute from "@/modules/auth/AdminRoute";
import Layout from "@/shared/layout/layout";

import DashboardPage from "@/modules/dashboard/page";
import BarangMasukPage from "@/modules/barang-masuk/page";
import BarangKeluarPage from "@/modules/barang-keluar/page";
import DataBarangPage from "@/modules/data-barang/page";
import TransaksiPage from "@/modules/transaksi/pages/page";
import PreparePage from "@/modules/transaksi/pages/prepare-page";
import LokasiBarangPage from "@/modules/lokasi-barang/page";
import StatistikTab from "@/modules/lokasi-barang/tabs/StatistikTab";
import ManajemenLokasiTab from "@/modules/lokasi-barang/tabs/ManajemenLokasiTab";
import ManajemenDataPage from "@/modules/manajemen-data/page";
import KategoriBarangPage from "@/modules/kategori-barang/page";
import TipeMaterialPage from "@/modules/tipe-material/page";
import MerekBarangPage from "@/modules/merek-barang/page";
import LoginPage from "@/modules/auth/LoginPage";
import GoogleCallbackPage from "@/modules/auth/GoogleCallbackPage";
import PengaturanPage from "@/modules/pengaturan/page";
import ManajemenUserPage from "@/modules/manajemen-user/page";

export function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/oauth/google/callback" element={<GoogleCallbackPage />} />
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<Layout />
					</ProtectedRoute>
				}>
				<Route index element={<DashboardPage />} />
				<Route path="barang-masuk" element={<BarangMasukPage />} />
				<Route path="barang-keluar" element={<BarangKeluarPage />} />
				<Route path="request" element={<TransaksiPage />} />
				<Route path="request/:id/prepare" element={<PreparePage />} />
				<Route path="data-barang" element={<DataBarangPage />} />
				<Route path="lokasi-barang" element={<LokasiBarangPage />}>
					<Route index element={<Navigate to="/lokasi-barang/statistik" replace />} />
					<Route path="statistik" element={<StatistikTab />} />
					<Route path="lokasi" element={<ManajemenLokasiTab />} />
				</Route>
				<Route path="manajemen-data" element={<ManajemenDataPage />}>
					<Route index element={<Navigate to="/manajemen-data/kategori" replace />} />
					<Route path="kategori" element={<KategoriBarangPage />} />
					<Route path="model" element={<TipeMaterialPage />} />
					<Route path="merek" element={<MerekBarangPage />} />
				</Route>
				<Route
					path="tipe-material"
					element={<Navigate to="/manajemen-data/model" replace />}
				/>
				<Route
					path="kategori-barang"
					element={<Navigate to="/manajemen-data/kategori" replace />}
				/>
				<Route
					path="merek-barang"
					element={<Navigate to="/manajemen-data/merek" replace />}
				/>
				<Route path="pengaturan" element={<PengaturanPage />} />
				<Route
					path="manajemen-user"
					element={
						<AdminRoute>
							<ManajemenUserPage />
						</AdminRoute>
					}
				/>
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "@/modules/auth/ProtectedRoute";
import AdminRoute from "@/modules/auth/AdminRoute";
import Layout from "@/shared/layout/layout";

import DashboardPage from "@/modules/dashboard/page";
import LoginPage from "@/modules/auth/LoginPage";

function PageLoader() {
	return (
		<div className="flex h-full min-h-[40vh] w-full items-center justify-center">
			<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
		</div>
	);
}

const BarangMasukPage = lazy(() => import("@/modules/barang-masuk/page"));
const BarangKeluarPage = lazy(() => import("@/modules/barang-keluar/page"));
const TransaksiPage = lazy(() => import("@/modules/transaksi/pages/page"));
const PreparePage = lazy(() => import("@/modules/transaksi/pages/prepare-page"));
const DataBarangPage = lazy(() => import("@/modules/data-barang/page"));
const LokasiBarangPage = lazy(() => import("@/modules/lokasi-barang/page"));
const StatistikTab = lazy(() => import("@/modules/lokasi-barang/tabs/StatistikTab"));
const ManajemenLokasiTab = lazy(() => import("@/modules/lokasi-barang/tabs/ManajemenLokasiTab"));
const ManajemenDataPage = lazy(() => import("@/modules/manajemen-data/page"));
const KategoriBarangPage = lazy(() => import("@/modules/kategori-barang/page"));
const TipeMaterialPage = lazy(() => import("@/modules/tipe-material/page"));
const MerekBarangPage = lazy(() => import("@/modules/merek-barang/page"));
const PengaturanPage = lazy(() => import("@/modules/pengaturan/page"));
const ManajemenUserPage = lazy(() => import("@/modules/manajemen-user/page"));
const PeminjamanMitraPage = lazy(() => import("@/modules/peminjaman-mitra/page"));

export function AppRoutes() {
	return (
		<Suspense fallback={<PageLoader />}>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
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
					<Route
						path="peminjaman-mitra"
						element={
							<AdminRoute>
								<PeminjamanMitraPage />
							</AdminRoute>
						}
					/>
				</Route>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Suspense>
	);
}
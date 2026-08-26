import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/shared/lib/utils";

const TABS = [
	{ to: "statistik", label: "Statistik" },
	{ to: "lokasi", label: "Manajemen Lokasi" },
] as const;

/** Shell halaman Lokasi Material: header + navigasi tab (nested routes). */
export default function LokasiBarangPage() {
	return (
		<div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-5 overflow-y-auto p-6">
			<header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-foreground">Lokasi Material</h1>
					<p className="mt-1 max-w-xl text-sm text-muted-foreground">
						Pantau okupansi gudang dan kelola rak, kardus, serta pallet.
					</p>
				</div>

				<nav aria-label="Tab Lokasi Material" className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
					{TABS.map((tab) => (
						<NavLink
							key={tab.to}
							to={tab.to}
							className={({ isActive }) =>
								cn(
									"cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
									isActive
										? "bg-primary/10 font-semibold text-foreground"
										: "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
								)
							}>
							{tab.label}
						</NavLink>
					))}
				</nav>
			</header>

			<Outlet />
		</div>
	);
}

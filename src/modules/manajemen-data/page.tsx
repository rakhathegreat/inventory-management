import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Box, CircleStar, Shapes } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const TABS = [
	{ value: "kategori", label: "Kategori", icon: Shapes },
	{ value: "model", label: "Model", icon: Box },
	{ value: "merek", label: "Merek", icon: CircleStar },
] as const;

export default function ManajemenDataPage() {
	const location = useLocation();

	return (
		<div className="mx-auto flex h-full w-full flex-col overflow-hidden">
			<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
				<aside className="shrink-0 overflow-x-auto border-b pb-2 lg:w-1/5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-10">
					<div className="border-b px-6 py-3 space-y-1">
						<h1 className="text-md font-medium">Manajemen Data</h1>
						<p className="text-xs text-muted-foreground">
							Referensi material untuk modul inventori
						</p>
					</div>

					<div className="flex flex-col px-3 pt-4 pb-3">
						<h4 className="px-3 pb-2 text-xs uppercase font-medium text-muted-foreground/70">
							Registri Material
						</h4>
						<nav className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
							{TABS.map((tab) => {
								const Icon = tab.icon;
								return (
									<NavLink
										key={tab.value}
										to={`/manajemen-data/${tab.value}`}
										className={({ isActive }) =>
											cn(
												"flex h-8 min-w-40 cursor-pointer items-center justify-start gap-2 rounded-md px-3 transition-colors",
												isActive
													? "bg-muted/50 text-foreground"
													: "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
											)
										}>
										<Icon className="size-4 shrink-0 opacity-70" />
										<span className="text-xs font-medium">{tab.label}</span>
									</NavLink>
								);
							})}
						</nav>
					</div>
				</aside>

				<div
					key={location.pathname}
					className="w-full flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
					<Outlet />
				</div>
			</div>
		</div>
	);
}

import { useState, useCallback, useMemo } from "react";
import { Search, ListFilter } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Checkbox } from "@/shared/ui/checkbox";
import { Calendar } from "@/shared/ui/calendar";
import { Separator } from "@/shared/ui/separator";
import { DateRange } from "react-day-picker";
import { cn } from "@/shared/lib/utils";
import { usePeminjamanMitra, type InterMitraTab } from "./hooks/usePeminjamanMitra";
import { RequestTable } from "./components/RequestTable";
import { RequestDetailDrawer } from "./components/RequestDetailDrawer";
import { RejectDialog } from "./components/RejectDialog";
import type { InterMitraRequest } from "./types";

const TABS: InterMitraTab[] = ["Semua", "Menunggu", "Disetujui", "Serah", "Selesai", "Ditolak / Dibatalkan"];

export default function PeminjamanMitraPage() {
	const {
		requests,
		isLoading,
		selected,
		setSelected,
		searchTerm,
		setSearchTerm,
		activeTab,
		setActiveTab,
		actionId,
		runAction,
		filtered,
	} = usePeminjamanMitra();

	const tabCounts = useMemo(() => {
		const match = (tab: InterMitraTab): number => {
			const norm = (s: string) => s.toUpperCase();
			switch (tab) {
				case "Semua":
					return requests.length;
				case "Menunggu":
					return requests.filter((r) => norm(r.status) === "MENUNGGU").length;
				case "Disetujui":
					return requests.filter((r) => norm(r.status) === "DISETUJUI").length;
				case "Serah":
					return requests.filter((r) => norm(r.status) === "SERAH").length;
				case "Selesai":
					return requests.filter((r) => norm(r.status) === "SELESAI").length;
				case "Ditolak / Dibatalkan":
					return requests.filter((r) => ["DITOLAK", "DIBATALKAN"].includes(norm(r.status))).length;
				default:
					return 0;
			}
		};
		return Object.fromEntries(TABS.map((t) => [t, match(t)])) as Record<InterMitraTab, number>;
	}, [requests]);

	const [rejectTarget, setRejectTarget] = useState<InterMitraRequest | null>(null);
	const isBusy = actionId !== null;

	const categoryOptions = useMemo(
		() => Array.from(new Set(requests.map((r) => r.partnerCategory).filter((c): c is string => !!c))).sort(),
		[requests],
	);

	const [filterCategories, setFilterCategories] = useState<string[]>([]);
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
	const [tempFilterCategories, setTempFilterCategories] = useState<string[]>([]);
	const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const hasActiveFilter = filterCategories.length > 0 || !!dateRange?.from || !!dateRange?.to;

	const handleApplyFilter = () => {
		setIsFilterOpen(false);
		setFilterCategories(tempFilterCategories);
		setDateRange(tempDateRange);
	};

	const handleResetFilter = () => {
		setIsFilterOpen(false);
		setTempFilterCategories([]);
		setTempDateRange(undefined);
		setFilterCategories([]);
		setDateRange(undefined);
	};

	const displayed = useMemo(() => {
		let data = filtered;
		if (filterCategories.length > 0) {
			data = data.filter((req) => req.partnerCategory && filterCategories.includes(req.partnerCategory));
		}
		if (dateRange?.from || dateRange?.to) {
			data = data.filter((req) => {
				const reqDate = new Date(req.requestedAt).getTime();
				if (dateRange.from) {
					const startDate = new Date(dateRange.from).setHours(0, 0, 0, 0);
					if (reqDate < startDate) return false;
				}
				if (dateRange.to) {
					const endDate = new Date(dateRange.to).setHours(23, 59, 59, 999);
					if (reqDate > endDate) return false;
				}
				return true;
			});
		}
		return data;
	}, [filtered, filterCategories, dateRange]);

	const handleApprove = useCallback(
		(request: InterMitraRequest) => {
			runAction(request.id, "DISETUJUI");
		},
		[runAction],
	);

	const handleReject = useCallback(
		(notes: string | null) => {
			if (!rejectTarget) return;
			runAction(rejectTarget.id, "DITOLAK", notes);
			setRejectTarget(null);
		},
		[rejectTarget, runAction],
	);

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-fade-in">
			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InterMitraTab)} className="w-full">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
					<div className="flex items-center w-full overflow-x-auto pb-1 scrollbar-hide">
						<TabsList className="inline-flex h-auto w-full lg:w-auto">
							{TABS.map((tab) => (
								<TabsTrigger key={tab} value={tab} className="cursor-pointer">
									{tab}
									{[ "Menunggu", "Disetujui", "Serah" ].includes(tab) && tabCounts[tab] > 0 && (
										<Badge variant="secondary">{tabCounts[tab]}</Badge>
									)}
								</TabsTrigger>
							))}
						</TabsList>
					</div>
					<div className="flex flex-row items-center gap-2 w-full lg:w-auto">
						<div className="relative flex-1 lg:w-64">
							<Search className="absolute top-[9px] left-3 size-4 text-muted-foreground" />
							<Input
								placeholder="Cari transaksi..."
								className="pl-9 w-full"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
						<Popover
							open={isFilterOpen}
							onOpenChange={(open) => {
								setIsFilterOpen(open);
								if (open) {
									setTempFilterCategories(filterCategories);
									setTempDateRange(dateRange);
								}
							}}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"shrink-0 gap-1.5 px-3 cursor-pointer",
										hasActiveFilter && "border-gray-400 text-primary",
									)}>
									<ListFilter className="size-4" />
									<span className="hidden sm:inline">Filter</span>
									{hasActiveFilter && <Badge variant="secondary" className="ml-1">{filterCategories.length + (dateRange?.from || dateRange?.to ? 1 : 0)}</Badge>}
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-auto p-4" onCloseAutoFocus={(e) => e.preventDefault()}>
								<div className="flex flex-col gap-3">
									<div className="space-y-2">
										<h4 className="font-medium text-sm leading-none text-muted-foreground">Kategori Partner</h4>
										<div className="flex flex-col gap-3">
											{categoryOptions.map((cat) => (
												<div key={cat} className="flex items-center space-x-2">
													<Checkbox
														id={`cat-${cat}`}
														checked={tempFilterCategories.includes(cat)}
														onCheckedChange={(checked) => {
															setTempFilterCategories((prev) =>
																checked ? [...prev, cat] : prev.filter((c) => c !== cat),
															);
														}}
													/>
													<label
														htmlFor={`cat-${cat}`}
														className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
														{cat}
													</label>
												</div>
											))}
										</div>
									</div>
									<Separator />
									<div className="space-y-3">
										<h4 className="font-medium text-sm leading-none text-muted-foreground">Rentang Tanggal</h4>
										<div className="border rounded-md">
											<Calendar
												mode="range"
												defaultMonth={tempDateRange?.from}
												selected={tempDateRange}
												onSelect={setTempDateRange}
												numberOfMonths={1}
												className="p-3"
											/>
										</div>
									</div>
									<div className="grid grid-cols-2 items-center gap-2">
										<Button variant="outline" size="sm" onClick={handleResetFilter} className="cursor-pointer">Reset</Button>
										<Button size="sm" onClick={handleApplyFilter} className="cursor-pointer">Terapkan</Button>
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				<RequestTable
					data={displayed}
					isLoading={isLoading}
					actionId={actionId}
					onRowClick={setSelected}
					onApprove={handleApprove}
					onReject={setRejectTarget}
				/>
			</Tabs>

			<RequestDetailDrawer
				request={selected}
				open={selected !== null}
				onClose={() => setSelected(null)}
				actionId={actionId}
				onApprove={handleApprove}
				onReject={setRejectTarget}
			/>

			<RejectDialog
				open={rejectTarget !== null}
				requestNumber={rejectTarget?.requestNumber || "-"}
				isBusy={isBusy}
				onOpenChange={(o) => !o && setRejectTarget(null)}
				onConfirm={handleReject}
			/>
		</div>
	);
}
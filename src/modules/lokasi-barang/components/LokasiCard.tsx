import { ArrowRightLeft, Edit, MoreVertical, Plus, Power, QrCode, Trash2 } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import type { Level, StorageLocation } from "@/shared/types/inventory";
import type { SheetMode } from "@/shared/types/ui";
import { cn } from "@/shared/lib/utils";
import { CapacityBar } from "./CapacityBar";
import { getTypeConfig } from "./type-config";

export interface LokasiCardActions {
	onOpenSheet: (mode: SheetMode, item?: { parentId?: string; levelId?: string }) => void;
	onToggleLocation: (id: string) => void;
	onToggleLevel: (rakId: string, levelId: string) => void;
	onDeleteLocation: (id: string, name: string) => void;
	onDeleteLevel: (levelId: string, name: string) => void;
	onDownloadQr: (url: string | null | undefined, name: string) => void;
	/** Buka Data Material terfilter untuk lokasi ini. */
	onViewItems: (query: string) => void;
	/** Pindahkan seluruh item dari lokasi ini ke lokasi lain. */
	onMigrate: (sourceId: string, sourceLabel: string, itemCount: number) => void;
}

interface LokasiCardProps extends LokasiCardActions {
	loc: StorageLocation;
	isToggling: boolean;
	isDeleting: boolean;
}

const menuItem = "cursor-pointer text-xs";
const menuItemDestructive = "cursor-pointer text-xs text-destructive focus:text-destructive";

function BrandRuleBadge({ rule }: { rule?: string | null }) {
	if (!rule) return null;
	return (
		<span className="max-w-28 truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
			{rule}
		</span>
	);
}

function CardMenu({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={label}
					className="size-7 shrink-0 cursor-pointer rounded-full text-muted-foreground">
					<MoreVertical className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48 text-xs">
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Kartu satu lokasi penyimpanan. Rak menampilkan daftar level; Kardus/Pallet ringkas dengan bar kapasitas. */
export function LokasiCard({
	loc,
	isToggling,
	isDeleting,
	onOpenSheet,
	onToggleLocation,
	onToggleLevel,
	onDeleteLocation,
	onDeleteLevel,
	onDownloadQr,
	onViewItems,
	onMigrate,
}: LokasiCardProps) {
	const config = getTypeConfig(loc.type);
	const Icon = config.icon;

	const header = (
		<div className="flex items-start justify-between gap-2">
			<div className="flex min-w-0 items-center gap-2.5">
				<span className={cn("shrink-0 rounded-lg p-1.5", config.chipBg)}>
					<Icon className={cn("size-4", config.text)} />
				</span>
				<div className="min-w-0">
					<CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
						<span className="truncate">{loc.name}</span>
						{!loc.isActive && (
<Badge variant="secondary" className="text-muted-foreground">
							Nonaktif
						</Badge>
						)}
					</CardTitle>
					<CardDescription className="mt-0.5 text-[11px]">
						{loc.type === "Rak"
							? `${loc.levels?.length || 0} level penyimpanan`
							: `Penyimpanan ${loc.type.toLowerCase()}`}
					</CardDescription>
				</div>
			</div>
			<CardMenu label={`Menu ${loc.name}`}>
				<DropdownMenuGroup>
					{loc.type === "Rak" ? (
						<>
							<DropdownMenuItem
								className={menuItem}
								onClick={() => onOpenSheet("edit-rak", { parentId: loc.id })}>
								<Edit /> Edit Nama Rak
							</DropdownMenuItem>
							<DropdownMenuItem
								className={menuItem}
								onClick={() => onOpenSheet("add-level", { parentId: loc.id })}>
								<Plus /> Tambah Level
							</DropdownMenuItem>
						</>
					) : (
						<>
							<DropdownMenuItem
								className={menuItem}
								onClick={() =>
									onOpenSheet(loc.type === "Kardus" ? "edit-kardus" : "edit-pallet", { parentId: loc.id })
								}>
								<Edit /> Edit {loc.type}
							</DropdownMenuItem>
							<DropdownMenuItem
								className={menuItem}
								onClick={() => onDownloadQr(loc.sheetUrl, loc.name)}>
								<QrCode /> Simpan QR Code
							</DropdownMenuItem>
													<DropdownMenuItem
								className={menuItem}
								disabled={!loc.usedCapacity}
								onClick={() => onMigrate(loc.id, loc.name, loc.usedCapacity || 0)}>
								<ArrowRightLeft /> Pindahkan Isi
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem disabled={isToggling} className={menuItem} onClick={() => onToggleLocation(loc.id)}>
						<Power /> {loc.isActive ? `Nonaktifkan ${loc.type}` : `Aktifkan ${loc.type}`}
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={isDeleting}
						className={menuItemDestructive}
						onClick={() => onDeleteLocation(loc.id, loc.name)}>
						<Trash2 /> Hapus {loc.type}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</CardMenu>
		</div>
	);

	function LevelRow({ lvl }: { lvl: Level }) {
		return (
			<li
				role="button"
				tabIndex={0}
				onClick={() => onViewItems(`${loc.name} - ${lvl.name}`)}
				onKeyDown={(e) => e.key === "Enter" && onViewItems(`${loc.name} - ${lvl.name}`)}
				className={cn(
					"group/level cursor-pointer px-4 py-3 transition-colors duration-200 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
					!(loc.isActive && lvl.isActive) && "opacity-55",
				)}>
				<div className="mb-2 flex items-center justify-between gap-2">
					<span className="text-xs font-semibold text-foreground">{lvl.name}</span>
					<div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
						<BrandRuleBadge rule={lvl.brandRule} />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									aria-label={`Menu ${lvl.name}`}
									className="size-6 cursor-pointer rounded-full text-muted-foreground opacity-60 transition-opacity duration-200 group-hover/level:opacity-100 focus-visible:opacity-100">
									<MoreVertical className="size-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48 text-xs">
								<DropdownMenuGroup>
									<DropdownMenuItem
										className={menuItem}
										onClick={() => onOpenSheet("edit-level", { parentId: loc.id, levelId: lvl.id })}>
										<Edit /> Edit Level
									</DropdownMenuItem>
									<DropdownMenuItem
										className={menuItem}
										onClick={() => onDownloadQr(lvl.sheetUrl, `${loc.name} - ${lvl.name}`)}>
										<QrCode /> Simpan QR Code
									</DropdownMenuItem>
									<DropdownMenuItem
										className={menuItem}
										disabled={!lvl.usedCapacity}
										onClick={() => onMigrate(lvl.id, `${loc.name} - ${lvl.name}`, lvl.usedCapacity)}>
										<ArrowRightLeft /> Pindahkan Isi
									</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuGroup>
									<DropdownMenuItem
										disabled={!loc.isActive || isToggling}
										className={menuItem}
										onClick={() => onToggleLevel(loc.id, lvl.id)}>
										<Power /> {lvl.isActive ? "Nonaktifkan Level" : "Aktifkan Level"}
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={isDeleting}
										className={menuItemDestructive}
										onClick={() => onDeleteLevel(lvl.id, lvl.name)}>
										<Trash2 /> Hapus Level
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<CapacityBar used={lvl.usedCapacity} capacity={lvl.capacity} baseBarClass={config.bar} />
			</li>
		);
	}

	if (loc.type !== "Rak") {
		return (
			<Card
				role="button"
				tabIndex={0}
				onClick={() => onViewItems(loc.name)}
				onKeyDown={(e) => e.key === "Enter" && onViewItems(loc.name)}
				className={cn(
					"cursor-pointer transition-colors duration-200 hover:border-muted-foreground/40",
					!loc.isActive && "opacity-60 saturate-50",
				)}>
				<CardContent className="flex h-full flex-col gap-4 p-4">
					{header}
					<div className="mt-auto space-y-2">
						<div className="flex justify-end">
							<BrandRuleBadge rule={loc.brandRule} />
						</div>
						<CapacityBar
							used={loc.usedCapacity || 0}
							capacity={loc.capacity || 0}
							baseBarClass={config.bar}
						/>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			className={cn(
				"transition-colors duration-200 hover:border-muted-foreground/40",
				!loc.isActive && "opacity-60 saturate-50",
			)}>
			<CardHeader className="border-b px-4 py-3.5">{header}</CardHeader>
			<CardContent className="p-0">
				<ul className="divide-y divide-border">
					{loc.levels?.map((lvl) => <LevelRow key={lvl.id} lvl={lvl} />)}
				</ul>
				{(!loc.levels || loc.levels.length === 0) && (
					<div className="m-3 flex flex-col items-center gap-1.5 rounded-lg border border-dashed py-8 text-center">
						<p className="text-xs text-muted-foreground">Rak ini belum memiliki level.</p>
						<Button
							variant="link"
							size="sm"
							className="h-auto cursor-pointer p-0 text-xs"
							onClick={() => onOpenSheet("add-level", { parentId: loc.id })}>
							Tambah level sekarang
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

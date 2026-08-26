"use client";

import * as React from "react";
import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";
import { Badge } from "@/shared/ui/badge";
import { StatusBadge } from "@/shared/ui/status-badge";
import {
	IconPackage,
	IconX,
	IconBan,
	IconFileText,
} from "@tabler/icons-react";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { getBaseUrl } from "@/shared/lib/api";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useNavigate } from "react-router-dom";
import type { DashboardRequest } from "@/modules/transaksi/types";
import { PackageCheck, ArrowUpDown, Edit } from "lucide-react";
import { PengambilanQrModal } from "./PengambilanQrModal";
import { RejectRequestModal } from "./RejectRequestModal";
import {
	DataTable,
	type DataTableEmptyState,
} from "@/shared/ui/data-table/DataTable";

/** Meta yang dapat diakses oleh kolom tabel. Bukan `any` — fully typed. */
export type TableMeta = {
	onRowClick?: (item: DashboardRequest) => void;
	onStatusChange?: (
		id: string,
		status: string,
		rejectionNotes?: string,
	) => void;
	onReject?: (
		row: DashboardRequest,
		status: "Ditolak" | "Dibatalkan",
	) => void;
	onPengambilan?: (row: DashboardRequest) => void;
};

export type DataTableProps = {
	data: DashboardRequest[];
	className?: string;
	onRowClick?: (item: DashboardRequest) => void;
	onStatusChange?: (
		id: string,
		status: string,
		rejectionNotes?: string,
	) => void;
	hiddenColumns?: string[];
	/** Kolom Jumlah: 'allocated' = jumlah alokasi, 'requested' = jumlah permintaan */
	countMode?: "requested" | "allocated";
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
	day: "2-digit",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
};

const REQUEST_EMPTY_STATE: DataTableEmptyState = {
	title: "Belum ada daftar permintaan.",
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function BastActions({
	row,
	table,
}: {
	row: { original: DashboardRequest };
	table: TanstackTable<DashboardRequest>;
}) {
	const status = row.original.status?.toUpperCase()?.trim();
	const meta = table.options.meta as TableMeta | undefined;

	const handleOpenDraftPDF = React.useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				const token = localStorage.getItem("arxiva-auth-token") || "";
				const url = `${getBaseUrl()}/requests/${row.original.id}/pdf-draft?token=${token}`;
				await openUrl(url);
			} catch (error) {
				toast.error("Gagal membuka PDF BAST Draft");
			}
		},
		[row.original.id],
	);

	const handleOpenSignedPDF = React.useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			try {
				const token = localStorage.getItem("arxiva-auth-token") || "";
				const url = `${getBaseUrl()}/requests/${row.original.id}/pdf-signed?token=${token}`;
				await openUrl(url);
			} catch (error) {
				toast.error("Gagal membuka PDF BAST Final");
			}
		},
		[row.original.id],
	);

	const showBastActions = ["SIAP", "SELESAI", "DITERIMA"].includes(
		status || "",
	);

	if (!showBastActions) return null;

	const isSigned = ["SELESAI", "DITERIMA"].includes(status || "");

	return (
		<div className="flex items-center justify-center gap-2">
			{!isSigned ? (
				<Button
					variant="outline"
					size="sm"
					className="h-8 text-xs text-muted-foreground font-medium cursor-pointer gap-1.5"
					title="Buka PDF BAST Draft (Tanpa TTD)"
					onClick={handleOpenDraftPDF}>
					<IconFileText size={16} />
					BAST Draft
				</Button>
			) : (
				<Button
					variant="outline"
					size="sm"
					className="h-8 text-xs font-medium cursor-pointer gap-1.5 text-muted-foreground"
					title="Buka PDF BAST Final (Ber-TTD)"
					onClick={handleOpenSignedPDF}>
					<IconFileText size={16} />
					Lihat BAST
				</Button>
			)}

			{status === "SIAP" && (
				<>
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs font-medium cursor-pointer gap-1.5"
						title="Pengambilan Material BAST"
						onClick={(e) => {
							e.stopPropagation();
							meta?.onPengambilan?.(row.original);
						}}>
						<PackageCheck size={16} />
						Pengambilan
					</Button>
				</>
			)}
		</div>
	);
}

function ActionMenu({
	row,
	table,
}: {
	row: { original: DashboardRequest };
	table: TanstackTable<DashboardRequest>;
}) {
	const status = row.original.status?.toUpperCase()?.trim();
	const meta = table.options.meta as TableMeta | undefined;

	const navigate = useNavigate();

	const handleNavigateToPrepare = React.useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			navigate(`/request/${row.original.id}/prepare`);
		},
		[navigate, row.original.id],
	);

	return (
		<div className="flex items-center gap-1 justify-center">
			{status === "MENUNGGU" && (
				<>
					<Button
						variant="ghost"
						size="icon-lg"
						className="text-xs font-medium text-muted-foreground hover:text-amber-600 cursor-pointer"
						onClick={handleNavigateToPrepare}
						title="Siapkan Material">
						<IconPackage size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon-lg"
						className="text-xs font-medium text-muted-foreground hover:text-destructive cursor-pointer"
						onClick={(e) => {
							e.stopPropagation();
							meta?.onReject?.(row.original, "Ditolak");
						}}
						title="Tolak Request">
						<IconX size={18} className="" />
					</Button>
				</>
			)}

			{status === "SIAP" && (
				<div>
					<Button
						variant="ghost"
						size="icon-lg"
						className="text-xs font-medium text-muted-foreground hover:text-blue-600 cursor-pointer"
						onClick={handleNavigateToPrepare}
						title="Edit Alokasi">
						<Edit strokeWidth={2} />
					</Button>
					<Button
						variant="ghost"
						size="icon-lg"
						className="text-xs font-medium text-muted-foreground hover:text-destructive cursor-pointer"
						onClick={(e) => {
							e.stopPropagation();
							meta?.onReject?.(row.original, "Dibatalkan");
						}}>
						<IconBan strokeWidth={2} />
					</Button>
				</div>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────
// Column Definitions (factory function agar columns tidak berisi closure meta)
// ─────────────────────────────────────────────

function createColumns(
	countMode: "requested" | "allocated" = "requested",
): ColumnDef<DashboardRequest>[] {
	return [
		{
			id: "nomor",
			header: () => <div className="text-center">No.</div>,
			cell: ({ row }) => (
				<div className="text-muted-foreground whitespace-nowrap text-center px-4">
					{row.index + 1}
				</div>
			),
		},
		{
			accessorKey: "requestNumber",
			header: "No. Permintaan",
			cell: ({ row }) => (
				<div className="font-medium text-primary uppercase">
					{row.original.requestNumber}
				</div>
			),
		},
		{
			accessorKey: "requestedAt",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
						className="p-0 hover:bg-transparent font-medium">
						Tanggal Permintaan
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => (
				<div className="text-muted-foreground whitespace-nowrap">
					{new Date(row.original.requestedAt).toLocaleDateString(
						"en-GB",
						DATE_FORMAT_OPTIONS,
					)}
				</div>
			),
		},
		{
			accessorKey: "requesterName",
			header: "Mitra",
			cell: ({ row }) => (
				<div className="text-foreground font-medium">
					{row.original.requesterName}
				</div>
			),
		},
		{
			accessorKey: "partnerCategory",
			header: "Kategori",
			cell: ({ row }) => (
				<Badge
					variant="outline"
					className="flex items-center text-muted-foreground whitespace-nowrap px-2 py-2.5 capitalize">
					{row.original.partnerCategory?.toLocaleLowerCase()}
				</Badge>
			),
		},
		{
			accessorKey: "itemsCount",
			header: () => <div className="text-center">Jumlah</div>,
			cell: ({ row }) => {
				const status = row.original.status?.toUpperCase()?.trim();
				const useAllocated =
					countMode === "allocated" ||
					["SIAP", "SELESAI", "DITERIMA"].includes(status || "");
				const count = useAllocated
					? (row.original.allocatedCount ?? 0)
					: (row.original.itemsCount ?? 0);
				return (
					<div className="text-muted-foreground whitespace-nowrap text-center">
						{count}
					</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: () => <div className="text-center">Status</div>,
			cell: ({ row }) => (
				<div className="flex items-center justify-center">
					<StatusBadge size="sm" status={row.original.status} />
				</div>
			),
		},
		{
			id: "catatan",
			header: "Catatan",
			cell: ({ row }) => {
				const note =
					row.original.rejectionNotes || row.original.adminRemarks || "-";
				return (
					<div
						className="text-muted-foreground max-w-60 truncate"
						title={note === "-" ? undefined : note}>
						{note}
					</div>
				);
			},
		},
		{
			accessorKey: "document",
			header: () => <div className="text-center">Dokumen</div>,
			cell: ({ row, table }) => <BastActions row={row} table={table} />,
		},
		{
			id: "actions",
			cell: ({ row, table }) => (
				<div className="flex items-center justify-center">
					<ActionMenu row={row} table={table} />
				</div>
			),
		},
	];
}

// ─────────────────────────────────────────────
// RequestTable — lapisan domain di atas shared DataTable
// ─────────────────────────────────────────────

export function RequestTable({
	data,
	className,
	onRowClick,
	onStatusChange,
	hiddenColumns = [],
	countMode = "requested",
}: DataTableProps) {
	const [rejectTarget, setRejectTarget] = React.useState<{
		row: DashboardRequest;
		status: "Ditolak" | "Dibatalkan";
	} | null>(null);

	const [pengambilanTarget, setPengambilanTarget] = React.useState<
		DashboardRequest | null
	>(null);

	const handleRejectConfirm = React.useCallback(
		(note: string) => {
			if (!rejectTarget) return;
			onStatusChange?.(rejectTarget.row.id, rejectTarget.status, note);
			setRejectTarget(null);
		},
		[onStatusChange, rejectTarget],
	);

	const handlePengambilanConfirm = React.useCallback(() => {
		if (pengambilanTarget) {
			onStatusChange?.(pengambilanTarget.id, "Selesai");
		}
		setPengambilanTarget(null);
	}, [onStatusChange, pengambilanTarget]);

	const tableMeta: TableMeta = React.useMemo(
		() => ({
			onRowClick,
			onStatusChange,
			onReject: (row, status) => setRejectTarget({ row, status }),
			onPengambilan: (row) => setPengambilanTarget(row),
		}),
		[onRowClick, onStatusChange],
	);

	const columns = React.useMemo(() => createColumns(countMode), [countMode]);

	const visibleColumns = React.useMemo(
		() =>
			columns.filter(
				(col) =>
					!hiddenColumns.includes((col as any).id) &&
					!hiddenColumns.includes((col as any).accessorKey),
			),
		[columns, hiddenColumns],
	);

	return (
		<>
			<DataTable<DashboardRequest>
				data={data}
				enableSelection
				getRowId={(row) => row.id}
				columns={visibleColumns}
				meta={tableMeta}
				onRowClick={onRowClick}
				className={className}
				emptyState={REQUEST_EMPTY_STATE}
			/>

			{/* Reject/Batalkan modal — rendered di luar TableRow agar klik di dalam
			    modal tidak mem-bubble ke onClick baris (membuka drawer). */}
			{rejectTarget && (
				<RejectRequestModal
					open
					onOpenChange={(open) => !open && setRejectTarget(null)}
					requestNumber={rejectTarget.row.requestNumber}
					title={
						rejectTarget.status === "Ditolak"
							? "Tolak Permintaan"
							: "Batalkan Permintaan"
					}
					description={
						rejectTarget.status === "Ditolak"
							? "Permintaan akan berstatus Ditolak dan alokasi material akan dilepas."
							: "Permintaan akan berstatus Dibatalkan dan alokasi material akan dilepas."
					}
					confirmLabel={
						rejectTarget.status === "Ditolak"
							? "Tolak Permintaan"
							: "Batalkan Permintaan"
					}
					onConfirm={handleRejectConfirm}
				/>
			)}

			{/* Pengambilan modal — alasan yang sama seperti di atas. */}
			{pengambilanTarget && (
				<PengambilanQrModal
					isOpen
					onOpenChange={(open) => !open && setPengambilanTarget(null)}
					request={pengambilanTarget}
					onSuccess={handlePengambilanConfirm}
				/>
			)}
		</>
	);
}

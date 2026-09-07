import { FileText, Loader2 } from "lucide-react";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
	DrawerFooter,
	DrawerClose,
} from "@/shared/ui/drawer";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import { getBaseUrl } from "@/shared/lib/api";
import type { InterMitraRequest } from "../types";

type RequestDetailDrawerProps = {
	request: InterMitraRequest | null;
	open: boolean;
	onClose: () => void;
	actionId: string | null;
	onApprove: (request: InterMitraRequest) => void;
	onReject: (request: InterMitraRequest) => void;
};

const formatDate = (value?: string) => {
	if (!value) return "-";
	return new Date(value).toLocaleString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const STATUS_LABEL: Record<string, string> = {
	MENUNGGU: "Menunggu Persetujuan Admin",
	DISETUJUI: "Disetujui",
	SERAH: "Serah",
	SELESAI: "Selesai",
	DITOLAK: "Ditolak",
	DIBATALKAN: "Dibatalkan",
};

export function RequestDetailDrawer({
	request,
	open,
	onClose,
	actionId,
	onApprove,
	onReject,
}: RequestDetailDrawerProps) {
	if (!request) return null;
	const pending = request.status.toUpperCase() === "MENUNGGU";
	const busy = actionId === request.id;

	return (
		<Drawer open={open} onOpenChange={(o) => !o && onClose()}>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<div className="flex items-center gap-3">
						<DrawerTitle>{request.requestNumber.toUpperCase()}</DrawerTitle>
						<StatusBadge status={request.status} size="sm" />
					</div>
					<DrawerDescription>Permintaan material antar mitra</DrawerDescription>
				</DrawerHeader>

				<div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4 text-sm">
					<div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border bg-muted/40 p-4">
						<div>
							<p className="text-xs text-muted-foreground">Mitra Peminta</p>
							<p className="font-medium">{request.requesterName || "-"}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Mitra Pemberi</p>
							<p className="font-medium">{request.providerName || "-"}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Diajukan</p>
							<p className="font-medium">{formatDate(request.requestedAt)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Status</p>
							<p className="font-medium">{STATUS_LABEL[request.status?.toUpperCase()] ?? (request.status || "-")}</p>
						</div>
						<div className="col-span-2">
							<p className="text-xs text-muted-foreground">Catatan</p>
							<p className="font-medium">{request.notes || "-"}</p>
						</div>
						{["DITOLAK", "DIBATALKAN"].includes(request.status.toUpperCase()) && request.rejectionNotes && (
							<div className="col-span-2">
								<p className="text-xs text-muted-foreground">Catatan Penolakan</p>
								<p className="font-medium text-rose-600">{request.rejectionNotes}</p>
							</div>
						)}
					</div>

					<div className="rounded-lg border overflow-hidden">
						<Table>
							<TableHeader className="bg-muted/60">
								<TableRow className="hover:bg-transparent">
									<TableHead>Kategori</TableHead>
									<TableHead>Merek</TableHead>
									<TableHead className="text-right">Jumlah</TableHead>
									<TableHead>SN Diberikan</TableHead>
									<TableHead>SN Diterima</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(request.requestItems ?? []).map((item) => (
									<TableRow key={item.id}>
										<TableCell className="font-medium">{item.category || "-"}</TableCell>
										<TableCell>{item.brand || "-"}</TableCell>
										<TableCell className="text-right font-medium">{item.quantity}</TableCell>
										<TableCell className="max-w-44 truncate" title={item.donorSerialNumbers || "-"}>
											{item.donorSerialNumbers || "-"}
										</TableCell>
										<TableCell className="max-w-44 truncate" title={item.receiverSerialNumbers || "-"}>
											{item.receiverSerialNumbers || "-"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{["DISETUJUI", "SERAH", "SELESAI"].includes(request.status.toUpperCase()) && (
						<a
							href={`${getBaseUrl()}/requests/${request.id}/bast-pdf`}
							target="_blank"
							rel="noreferrer"
							className="flex items-center justify-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-muted"
						>
							<FileText className="size-4" /> Unduh BAST
						</a>
					)}
				</div>

				<DrawerFooter className="w-full pt-2">
					<div className="flex w-full gap-2">
						{pending && (
							<>
								<Button
									variant="default"
									className="flex-1 cursor-pointer"
									disabled={busy}
									onClick={() => onApprove(request)}
								>
									{busy && <Loader2 className="size-4 animate-spin mr-1" />}
									Setujui Permintaan
								</Button>
								<Button
									variant="destructive"
									className="flex-1 cursor-pointer"
									disabled={busy}
									onClick={() => onReject(request)}
								>
									Tolak Permintaan
								</Button>
							</>
						)}
						<DrawerClose asChild>
							<Button variant="outline" className="flex-1 cursor-pointer">
								Tutup
							</Button>
						</DrawerClose>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
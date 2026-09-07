import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import type { InterMitraRequest } from "../types";

type RequestTableProps = {
	data: InterMitraRequest[];
	isLoading: boolean;
	actionId: string | null;
	onRowClick: (request: InterMitraRequest) => void;
	onApprove: (request: InterMitraRequest) => void;
	onReject: (request: InterMitraRequest) => void;
};

export function RequestTable({
	data,
	isLoading,
	actionId,
	onRowClick,
	onApprove,
	onReject,
}: RequestTableProps) {
	if (isLoading) {
		return (
			<div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
				<Loader2 className="size-5 animate-spin" />
				<span>Memuat data...</span>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
				Tidak ada permintaan antar mitra pada daftar ini.
			</div>
		);
	}

	return (
		<div className="rounded-lg border overflow-hidden">
			<div className="overflow-x-auto">
				<Table className="whitespace-nowrap">
					<TableHeader className="bg-muted/60">
						<TableRow className="hover:bg-transparent">
							<TableHead>No. Request</TableHead>
							<TableHead>Peminta</TableHead>
							<TableHead>Mitra Pemberi</TableHead>
							<TableHead>Detail Barang</TableHead>
							<TableHead className="text-right">Jumlah</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Aksi</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((request) => {
							const pending = request.status.toUpperCase() === "MENUNGGU";
							const busy = actionId === request.id;
							return (
								<TableRow
									key={request.id}
									className="cursor-pointer"
									onClick={() => onRowClick(request)}
								>
									<TableCell className="font-medium">{request.requestNumber}</TableCell>
									<TableCell>{request.requesterName || "-"}</TableCell>
									<TableCell>{request.providerName || "-"}</TableCell>
									<TableCell className="max-w-64 truncate" title={request.itemsDetail}>
										{request.itemsDetail || "-"}
									</TableCell>
									<TableCell className="text-right font-medium">{request.itemsCount ?? 0}</TableCell>
									<TableCell>
										<StatusBadge status={request.status} size="sm" />
									</TableCell>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<div className="flex justify-end gap-2">
											{pending && (
												<>
													<Button
														size="sm"
														variant="default"
														className="cursor-pointer"
														disabled={busy}
														onClick={() => onApprove(request)}
													>
														{busy && <Loader2 className="size-3.5 animate-spin mr-1" />}
														Setujui
													</Button>
													<Button
														size="sm"
														variant="destructive"
														className="cursor-pointer"
														disabled={busy}
														onClick={() => onReject(request)}
													>
														Tolak
													</Button>
												</>
											)}
											{!pending && (
												<Button
													size="sm"
													variant="outline"
													className="cursor-pointer"
													onClick={() => onRowClick(request)}
												>
													Detail
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
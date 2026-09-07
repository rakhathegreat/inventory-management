import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Textarea } from "@/shared/ui/textarea";

type RejectDialogProps = {
	open: boolean;
	requestNumber: string;
	isBusy: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (notes: string | null) => void;
};

export function RejectDialog({
	open,
	requestNumber,
	isBusy,
	onOpenChange,
	onConfirm,
}: RejectDialogProps) {
	const [notes, setNotes] = useState("");

	return (
		<AlertDialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Tolak Permintaan {requestNumber}</AlertDialogTitle>
					<AlertDialogDescription>
						Permintaan akan berstatus Ditolak. Mitra peminta & pemberi akan menerima notifikasi.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="flex flex-col gap-2">
					<Textarea
						placeholder="Catatan penolakan (opsional)"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows={3}
					/>
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel className="cursor-pointer" disabled={isBusy}>
						Batal
					</AlertDialogCancel>
					<AlertDialogAction
						className="cursor-pointer"
						disabled={isBusy}
						onClick={(e) => {
							e.preventDefault();
							onConfirm(notes.trim() || null);
						}}
					>
						{isBusy && <Loader2 className="size-4 animate-spin mr-1" />}
						Ya, Tolak
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
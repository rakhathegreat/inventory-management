import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";

interface RejectRequestModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Nomor permintaan yang ditampilkan di judul modal. */
	requestNumber: string;
	title: string;
	description: string;
	confirmLabel: string;
	/** Dipanggil dengan catatan yang diisi user (boleh kosong). */
	onConfirm: (note: string) => void;
}

/**
 * Modal konfirmasi penolakan/pembatalan permintaan dengan kolom catatan.
 * Catatan dikirim ke backend lalu ditampilkan di tab "Ditolak / Batal".
 */
export function RejectRequestModal({
	open,
	onOpenChange,
	requestNumber,
	title,
	description,
	confirmLabel,
	onConfirm,
}: RejectRequestModalProps) {
	const [note, setNote] = useState("");

	useEffect(() => {
		if (open) setNote("");
	}, [open]);

	const handleConfirm = () => {
		onConfirm(note.trim());
		setNote("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="space-y-1.5">
					<Label htmlFor="rejection-note">Catatan</Label>
					<Textarea
						id="rejection-note"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder={`Masukkan catatan penolakan untuk ${requestNumber}...`}
					/>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						className="cursor-pointer"
						onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					<Button
						variant="destructive"
						className="cursor-pointer"
						onClick={handleConfirm}>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

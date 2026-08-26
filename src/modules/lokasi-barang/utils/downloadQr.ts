import QRCode from "qrcode";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { toast } from "sonner";

/** Render QR dari URL spreadsheet ke PNG berlabel lalu simpan (Tauri fs / browser download). */
export async function downloadQrCode(url: string | null | undefined, locationName: string) {
	if (!url) {
		toast.error("Link spreadsheet belum tersedia untuk lokasi ini.");
		return;
	}
	try {
		const qrDataUrl = await QRCode.toDataURL(url, {
			width: 300,
			margin: 2,
			color: { dark: "#000000", light: "#ffffff" },
		});
		const img = new Image();
		img.src = qrDataUrl;
		await new Promise((resolve) => {
			img.onload = resolve;
		});
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		canvas.width = 340;
		canvas.height = 380;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, 340, 380);
		ctx.drawImage(img, 20, 20, 300, 300);
		ctx.fillStyle = "#000000";
		ctx.font = "bold 24px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(locationName, 170, 345);
		const downloadUrl = canvas.toDataURL("image/png");
		const filename = `${locationName.replace(/[^a-zA-Z0-9]/g, "_")}.png`;

		if (isTauri()) {
			const base64Data = downloadUrl.replace(/^data:image\/png;base64,/, "");
			const binaryString = window.atob(base64Data);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
			const savedPath = await invoke<string>("save_arxiva_file", {
				subfolder: "qr",
				filename,
				data: Array.from(bytes),
			});
			toast.success(`Berhasil menyimpan QR Code ke folder ${savedPath}`);
		} else {
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast.success(`Berhasil menyimpan QR Code untuk ${locationName}`);
		}
	} catch {
		toast.error("Terjadi kesalahan saat membuat QR Code.");
	}
}

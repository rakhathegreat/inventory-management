import { useCallback, useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CheckCircle2, CloudOff, Loader2, Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const getBaseUrl = () => {
	const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "";
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const getHeaders = () => {
	const token = localStorage.getItem("arxiva-auth-token");
	return { Authorization: token || "", "Content-Type": "application/json" } as Record<string, string>;
};

/** Tab Pengaturan > Google Drive (admin): sambungkan akun untuk QR code lokasi. */
export function GoogleDriveTab() {
	const [isConnected, setIsConnected] = useState(false);
	const [googleEmail, setGoogleEmail] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isDisconnecting, setIsDisconnecting] = useState(false);

	const checkStatus = useCallback(async () => {
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google/status`, {
				headers: getHeaders(),
			});
			if (!res.ok) throw new Error();
			const data = await res.json();
			setIsConnected(Boolean(data.googleConnected));
			setGoogleEmail(data.googleEmail || "");
		} catch {
			toast.error("Gagal memeriksa status koneksi Google.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		checkStatus();
	}, [checkStatus]);

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google`, { headers: getHeaders() });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.message || "Gagal membuat link otorisasi.");

			try {
				await openUrl(data.url);
			} catch {
				window.open(data.url, "_blank");
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal memulai koneksi Google.");
		} finally {
			setIsConnecting(false);
		}
	};

	const handleDisconnect = async () => {
		setIsDisconnecting(true);
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google/disconnect`, {
				method: "DELETE",
				headers: getHeaders(),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.message || "Gagal memutus koneksi.");
			}
			setIsConnected(false);
			setGoogleEmail("");
			toast.success("Akun Google berhasil diputus");
		} catch (err: any) {
			toast.error(err.message);
		} finally {
			setIsDisconnecting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Koneksi Google Drive</CardTitle>
					<CardDescription className="text-xs">
						Sambungkan satu akun Google untuk sistem. Setiap lokasi material yang dibuat
						otomatis mendapat spreadsheet untuk QR code-nya.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					{isLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
							Memeriksa status koneksi...
						</div>
					) : isConnected ? (
						<div className="flex items-start gap-3">
							<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
							<div>
								<p className="text-sm font-medium text-foreground">Terhubung</p>
								<p className="text-xs text-muted-foreground">{googleEmail}</p>
							</div>
						</div>
					) : (
						<div className="flex items-start gap-3">
							<CloudOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
							<div>
								<p className="text-sm font-medium text-foreground">Belum terhubung</p>
								<p className="text-xs text-muted-foreground">
									Hubungkan akun Google agar lokasi baru otomatis punya spreadsheet & QR.
								</p>
							</div>
						</div>
					)}

					<div className="flex shrink-0 items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="cursor-pointer gap-2 text-xs"
							onClick={checkStatus}
							disabled={isLoading}>
							<RefreshCw className="size-3.5" /> Periksa ulang
						</Button>
						{!isConnected && (
							<Button size="sm" className="cursor-pointer gap-2 text-xs" onClick={handleConnect} disabled={isConnecting}>
								{isConnecting ? (
									<>
										<Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" /> Menghubungkan...
									</>
								) : (
									<>
										<Link2 className="size-3.5" /> Sambungkan Google
									</>
								)}
							</Button>
						)}
						{isConnected && (
							<Button
								variant="destructive"
								size="sm"
								className="cursor-pointer text-xs"
								onClick={handleDisconnect}
								disabled={isDisconnecting}>
								{isDisconnecting ? "Memutus..." : "Putuskan"}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-semibold text-foreground">Yang perlu diketahui</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
						<li>Hanya akun Google yang tersambung oleh admin yang dipakai sistem — cukup satu kali.</li>
						<li>Spreadsheet lokasi dibuat saat lokasi ditambahkan; QR code-nya berisi link spreadsheet tersebut.</li>
						<li>Melepas koneksi tidak menghapus spreadsheet yang sudah ada.</li>
						<li>
							Pastikan <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">GOOGLE_REDIRECT_URI</code>{" "}
							menunjuk ke <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">/oauth/google/callback</code>{" "}
							pada aplikasi ini.
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

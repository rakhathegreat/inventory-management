import { useCallback, useEffect, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
	CheckCircle2,
	CloudOff,
	Loader2,
	Link2,
	RefreshCw,
	FolderOpen,
	Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { getBaseUrl, getHeaders } from "@/shared/lib/api.client";

/** Tab Pengaturan > Google Drive (admin): sambungkan akun & atur folder target spreadsheet. */
export function GoogleDriveTab() {
	const [isConnected, setIsConnected] = useState(false);
	const [googleEmail, setGoogleEmail] = useState("");
	const [rootFolderId, setRootFolderId] = useState("");
	const [folderIdInput, setFolderIdInput] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isPolling, setIsPolling] = useState(false);
	const [isDisconnecting, setIsDisconnecting] = useState(false);
	const [isSavingFolder, setIsSavingFolder] = useState(false);
	const pollRef = useRef(false);

	const checkStatus = useCallback(async () => {
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google/status`, {
				headers: getHeaders(),
			});
			if (!res.ok) throw new Error();
			const data = await res.json();
			setIsConnected(Boolean(data.googleConnected));
			setGoogleEmail(data.googleEmail || "");
			setRootFolderId(data.rootFolderId || "");
			setFolderIdInput(data.rootFolderId || "");
		} catch {
			toast.error("Gagal memeriksa status koneksi Google.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		checkStatus();
		return () => {
			pollRef.current = false;
		};
	}, [checkStatus]);

	const pollStatusUntilConnected = useCallback(async () => {
		pollRef.current = true;
		const deadline = Date.now() + 5 * 60 * 1000;
		while (Date.now() < deadline && pollRef.current) {
			await new Promise((r) => setTimeout(r, 2000));
			try {
				const res = await fetch(`${getBaseUrl()}/auth/google/status`, {
					headers: getHeaders(),
				});
				if (!res.ok) continue;
				const data = await res.json();
				if (data.googleConnected) {
					setIsConnected(true);
					setGoogleEmail(data.googleEmail || "");
					setRootFolderId(data.rootFolderId || "");
					setFolderIdInput(data.rootFolderId || "");
					toast.success("Akun Google berhasil terhubung", {
						description: data.googleEmail || undefined,
					});
					return true;
				}
			} catch {
				// jaringan sesaat terputus — lanjutkan polling
			}
		}
		pollRef.current = false;
		return false;
	}, []);

	const handleConnect = async () => {
		setIsConnecting(true);
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google`, {
				headers: getHeaders(),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok)
				throw new Error(data.message || "Gagal membuat link otorisasi.");

			try {
				await openUrl(data.url);
			} catch {
				window.open(data.url, "_blank");
			}

			setIsConnecting(false);
			setIsPolling(true);
			const connected = await pollStatusUntilConnected();
			setIsPolling(false);
			if (!connected)
				toast.error("Koneksi tidak selesai dalam batas waktu. Coba lagi.");
			return;
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

	const handleSaveFolderId = async () => {
		if (!folderIdInput.trim()) {
			toast.error("Folder ID tidak boleh kosong.");
			return;
		}
		setIsSavingFolder(true);
		try {
			const res = await fetch(`${getBaseUrl()}/auth/google/folder-id`, {
				method: "PUT",
				headers: getHeaders(),
				body: JSON.stringify({ folderId: folderIdInput.trim() }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok)
				throw new Error(data.message || "Gagal menyimpan Folder ID.");
			setRootFolderId(data.rootFolderId || folderIdInput.trim());
			const sync = data.sync;
			if (sync) {
				let msg = "Drive Folder ID berhasil disimpan";
				const parts: string[] = [];
				if (sync.created) parts.push(`${sync.created} dibuat`);
				if (sync.updated) parts.push(`${sync.updated} diupdate`);
				if (parts.length) msg += ` · ${parts.join(", ")} spreadsheet lokasi`;
				if (Array.isArray(sync.failed) && sync.failed.length)
					msg += ` · ${sync.failed.length} gagal`;
				toast.success(msg);
			} else {
				toast.success("Drive Folder ID berhasil disimpan");
			}
		} catch (err: any) {
			toast.error(err.message || "Gagal menyimpan Folder ID.");
		} finally {
			setIsSavingFolder(false);
		}
	};

	const folderIdChanged = folderIdInput.trim() !== rootFolderId;

	return (
		<div className="flex flex-col gap-6">
			{/* Card 1: Status Koneksi OAuth */}
			<Card className="mt-10">
				<CardHeader>
					<CardTitle className="text-base">Koneksi Google Drive</CardTitle>
					<CardDescription className="text-xs">
						Sambungkan satu akun Google untuk sistem. Setiap lokasi material
						yang dibuat otomatis mendapat spreadsheet untuk QR code-nya.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					{isLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
							Memeriksa status koneksi...
						</div>
					) : isPolling ? (
						<div className="flex items-start gap-3">
							<Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />
							<div>
								<p className="text-sm font-medium text-foreground">
									Menunggu persetujuan Google...
								</p>
								<p className="text-xs text-muted-foreground">
									Selesaikan login di browser yang terbuka — halaman ini
									diperbarui otomatis.
								</p>
							</div>
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
								<p className="text-sm font-medium text-foreground">
									Belum terhubung
								</p>
								<p className="text-xs text-muted-foreground">
									Hubungkan akun Google agar lokasi baru otomatis punya
									spreadsheet &amp; QR.
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
						{!isConnected && !isPolling && (
							<Button
								size="sm"
								className="cursor-pointer gap-2 text-xs"
								onClick={handleConnect}
								disabled={isConnecting}>
								{isConnecting ? (
									<>
										<Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />{" "}
										Membuka Google...
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

			{/* Card 2: Konfigurasi Drive Folder ID */}
			<Card className={!isConnected ? "opacity-60" : undefined}>
				<CardHeader>
					<div className="flex items-center gap-2">
						<FolderOpen className="size-4 text-muted-foreground" />
						<CardTitle className="text-base">Folder Tujuan Drive</CardTitle>
					</div>
					<CardDescription className="text-xs">
						ID folder Google Drive tempat spreadsheet lokasi akan disimpan.
						Biarkan kosong untuk menyimpan di root Drive.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{!isConnected && (
						<p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
							Hubungkan akun Google terlebih dahulu untuk mengatur Folder ID.
						</p>
					)}
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="folder-id" className="text-xs">
							Google Drive Folder ID
						</Label>
						<div className="flex gap-2">
							<Input
								id="folder-id"
								value={folderIdInput}
								onChange={(e) => setFolderIdInput(e.target.value)}
								placeholder="Contoh: 1JVje8BVIRAhQZVTjmbBAo5dMg1gVh6Xs"
								disabled={!isConnected || isSavingFolder}
								className="h-8 font-mono text-xs"
							/>
							<Button
								size="sm"
								className="h-8 cursor-pointer gap-1.5 text-xs"
								onClick={handleSaveFolderId}
								disabled={!isConnected || isSavingFolder || !folderIdChanged}>
								{isSavingFolder ? (
									<Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
								) : (
									<Save className="size-3.5" />
								)}
								Simpan
							</Button>
						</div>
						{rootFolderId && (
							<p className="text-[11px] text-muted-foreground">
								Aktif:{" "}
								<a
									href={`https://drive.google.com/drive/folders/${rootFolderId}`}
									target="_blank"
									rel="noreferrer"
									className="font-mono underline underline-offset-2 hover:text-foreground">
									{rootFolderId}
								</a>
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Card 3: Info */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-semibold text-foreground">
						Yang perlu diketahui
					</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
						<li>
							Hanya akun Google yang tersambung oleh admin yang dipakai sistem —
							cukup satu kali.
						</li>
						<li>
							Spreadsheet lokasi dibuat saat lokasi ditambahkan, atau saat
							menyimpan Folder ID baru — otomatis diisi data barang dari
							lokasi tersebut.
						</li>
						<li>Melepas koneksi tidak menghapus spreadsheet yang sudah ada.</li>
						<li>
							Folder ID dapat ditemukan di URL Google Drive:{" "}
							<code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
								drive.google.com/drive/folders/[FOLDER_ID]
							</code>
						</li>
						<li>
							Redirect OAuth diarahkan ke server backend — pastikan{" "}
							<code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
								GOOGLE_REDIRECT_URI
							</code>{" "}
							dan URI yang sama di Google Cloud Console dapat dijangkau browser
							Anda.
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

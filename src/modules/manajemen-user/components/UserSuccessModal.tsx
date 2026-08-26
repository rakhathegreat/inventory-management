import * as React from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import type { SuccessCredential } from "../hooks/useManajemenUser";

function roleLabel(role: string) {
	if (role === "ADMIN") return "Admin";
	if (role === "INTERNAL") return "Internal";
	return "Mitra";
}

async function copyText(value: string, label: string) {
	try {
		await navigator.clipboard.writeText(value);
		toast.success(`${label} tersalin`);
	} catch {
		toast.error("Gagal menyalin. Salin manual dari layar.");
	}
}

/**
 * Receipt akun baru/reset password: panel kiri ikon sukses (bulat, abu
 * transparan), kanan rangkuman kredensial. Layout 50:50 di layar lebar.
 */
export function UserSuccessModal({
	credential,
	onClose,
}: {
	credential: SuccessCredential | null;
	onClose: () => void;
}) {
	const [showPassword, setShowPassword] = React.useState(false);

	React.useEffect(() => {
		if (credential) setShowPassword(false);
	}, [credential]);

	if (!credential) return null;

	const rows = [
		{ label: "Nama", value: credential.nama },
		{ label: "Username", value: credential.username },
		{ label: "Role", value: roleLabel(credential.role) },
	];

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
				<DialogTitle className="sr-only">Akun berhasil dibuat</DialogTitle>
				<div className="grid grid-cols-1 sm:grid-cols-2">
					{/* Panel ikon sukses */}
					<div className="flex flex-col items-center justify-center gap-4 bg-muted/40 py-10 sm:py-0">
						<div className="relative flex size-28 items-center justify-center">
							<span
								aria-hidden="true"
								className="success-ripple absolute inset-0 rounded-full border-2 border-emerald-500/40"
							/>
							<span
								aria-hidden="true"
								className="success-ripple-delayed absolute inset-0 rounded-full border-2 border-emerald-500/30"
							/>
							<span className="relative flex size-28 items-center justify-center rounded-full bg-emerald-500/15">
								<Check className="size-14 text-emerald-500" strokeWidth={2.5} />
							</span>
						</div>
						{/* <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">Berhasil!</p> */}
					</div>

					{/* Panel receipt */}
					<div className="flex min-w-0 flex-col p-6 sm:p-8">
						<h2 className="text-lg font-semibold text-foreground">
							Akun siap digunakan
						</h2>
						<p className="mt-1 text-xs text-muted-foreground">
							Catat kredensial ini — password bisa diganti sendiri setelah
							login.
						</p>

						<dl className="mt-5 rounded-xl border border-dashed p-4">
							{rows.map(({ label, value }) => (
								<div
									key={label}
									className="flex items-baseline justify-between gap-4 py-1.5">
									<dt className="shrink-0 text-xs text-muted-foreground">
										{label}
									</dt>
									<dd className="min-w-0 truncate text-right text-sm font-medium text-foreground">
										{value}
									</dd>
								</div>
							))}

							<div className="mt-2 flex items-baseline justify-between gap-4 border-t pt-3">
								<dt className="shrink-0 text-xs text-muted-foreground">
									Password
								</dt>
								<dd className="flex min-w-0 items-center gap-1.5">
									<code className="truncate font-mono text-xs text-foreground">
										{showPassword
											? credential.password
											: "•".repeat(Math.max(8, credential.password.length))}
									</code>
									<button
										type="button"
										onClick={() => setShowPassword((v) => !v)}
										aria-label={
											showPassword ? "Sembunyikan password" : "Lihat password"
										}
										className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
										{showPassword ? (
											<EyeOff className="size-3.5" />
										) : (
											<Eye className="size-3.5" />
										)}
									</button>
									<button
										type="button"
										onClick={() => copyText(credential.password, "Password")}
										aria-label="Salin password"
										className="cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
										<Copy className="size-3.5" />
									</button>
								</dd>
							</div>
						</dl>

						<div className="mt-6 flex justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								className="cursor-pointer gap-2 text-xs"
								onClick={() =>
									copyText(
										`Nama: ${credential.nama}\nUsername: ${credential.username}\nRole: ${roleLabel(
											credential.role,
										)}\nPassword: ${credential.password}`,
										"Rangkuman akun",
									)
								}>
								<Copy className="size-3.5" /> Salin Semua
							</Button>
							<Button
								size="sm"
								onClick={onClose}
								className="cursor-pointer text-xs">
								Selesai
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

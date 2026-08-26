import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import type { ManagedUser, UserPayload } from "../api/userApi";
import type { BackendRole } from "./role-meta";

const ROLE_HELP: Record<BackendRole, string> = {
	ADMIN: "Akses penuh: mengelola inventori, lokasi, dan user lain.",
	INTERNAL: "Staf kantor KP, tanpa lokasi penyimpanan atau peran mitra.",
	MITRA: "Mitra dapat menerima material dari KP dan memiliki lokasi penyimpanan sendiri.",
};

const PARTNER_TYPES = ["AKTIVASI", "GANGGUAN"] as const;

interface UserFormModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	/** Null = mode tambah. */
	user: ManagedUser | null;
	currentUserId: string | null;
	isSaving: boolean;
	onSubmit: (payload: Omit<UserPayload, "username" | "password">) => Promise<void>;
}

interface FormState {
	role: BackendRole;
	nama: string;
	email: string;
	telepon: string;
	code: string;
	partnerType: (typeof PARTNER_TYPES)[number];
}

const EMPTY_FORM: FormState = {
	role: "MITRA",
	nama: "",
	email: "",
	telepon: "",
	code: "",
	partnerType: "AKTIVASI",
};

function toFormState(user: ManagedUser | null): FormState {
	if (!user) return { ...EMPTY_FORM };
	return {
		role: (user.role as BackendRole) ?? "MITRA",
		nama: user.profile?.nama || "",
		email: user.profile?.email && user.profile.email !== "-" ? user.profile.email : "",
		telepon: user.profile?.telepon && user.profile.telepon !== "-" ? user.profile.telepon : "",
		code: user.profile?.code && user.profile.code !== "-" ? user.profile.code : "",
		partnerType:
			user.profile?.partnerType === "GANGGUAN"
				? "GANGGUAN"
				: user.profile?.partnerType === "Supplier"
					? "AKTIVASI"
					: "AKTIVASI",
	};
}

/** Modal tambah/edit akun user. Username & password dibuat otomatis oleh sistem. */
export function UserFormModal({
	isOpen,
	onOpenChange,
	user,
	currentUserId,
	isSaving,
	onSubmit,
}: UserFormModalProps) {
	const isEdit = user !== null;
	const isSelf = isEdit && user.id === currentUserId;
	const [form, setForm] = React.useState<FormState>(() => toFormState(user));
	const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

	React.useEffect(() => {
		if (isOpen) {
			setForm(toFormState(user));
			setErrors({});
		}
	}, [isOpen, user]);

	const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
		setForm((f) => ({ ...f, [field]: value }));
		setErrors((e) => ({ ...e, [field]: undefined }));
	};

	const validate = (): boolean => {
		const next: Partial<Record<keyof FormState, string>> = {};
		if (!form.nama.trim()) next.nama = "Nama wajib diisi.";
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate() || isSaving) return;

		const payload: Omit<UserPayload, "username" | "password"> = {
			role: form.role,
			nama: form.nama.trim(),
			email: form.email.trim(),
			telepon: form.telepon.trim(),
		};
		if (form.role === "MITRA") {
			payload.code = form.code.trim() || "-";
			payload.partnerType = form.partnerType;
		}

		try {
			await onSubmit(payload);
			onOpenChange(false);
		} catch {
			// Error sudah ditampilkan sebagai toast oleh pemanggil.
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? `Edit Akun ${user?.username}` : "Tambah Akun Baru"}</DialogTitle>
					<DialogDescription className="text-xs">
						{isEdit
							? "Perbarui detail akun di bawah ini."
							: "Username & password dibuat otomatis dan ditampilkan setelah akun tersimpan."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-1.5">
						<Label htmlFor="user-role" className="text-sm font-medium">
							Role
						</Label>
						<Select
							value={form.role}
							onValueChange={(val) => setField("role", val as BackendRole)}
							disabled={isSelf}>
							<SelectTrigger id="user-role" className="cursor-pointer">
								<SelectValue placeholder="Pilih role" />
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(ROLE_HELP) as BackendRole[]).map((role) => (
									<SelectItem key={role} value={role} className="cursor-pointer">
										{role === "ADMIN" ? "Admin" : role === "INTERNAL" ? "Internal" : "Mitra"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-[11px] text-muted-foreground">{ROLE_HELP[form.role]}</p>
					</div>

					<div className="grid gap-1.5">
						<Label htmlFor="user-nama" className="text-sm font-medium">
							Nama
						</Label>
						<Input
							id="user-nama"
							value={form.nama}
							onChange={(e) => setField("nama", e.target.value)}
							placeholder={
								form.role === "MITRA"
									? "Nama mitra — juga dipakai sebagai nama lokasinya"
									: "Nama lengkap"
							}
						/>
						{errors.nama && <p className="text-xs text-destructive">{errors.nama}</p>}
					</div>

					{form.role === "MITRA" && (
						<>
							<div className="grid gap-1.5">
								<Label>Tipe mitra</Label>
								<div role="radiogroup" aria-label="Tipe mitra" className="grid grid-cols-2 gap-2">
									{PARTNER_TYPES.map((type) => (
										<button
											key={type}
											type="button"
											role="radio"
											aria-checked={form.partnerType === type}
											onClick={() => setField("partnerType", type)}
											className={cn(
												"cursor-pointer rounded-lg border px-3 py-3 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
												form.partnerType === type
													? "border-primary/50 bg-primary/10 font-semibold text-foreground"
													: "text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/50",
											)}>
											{type.charAt(0) + type.slice(1).toLowerCase()}
										</button>
									))}
								</div>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="user-code" className="text-sm font-medium">
									Kode mitra{" "}
									<span className="font-normal text-muted-foreground">(opsional)</span>
								</Label>
								<Input
									id="user-code"
									value={form.code}
									onChange={(e) => setField("code", e.target.value)}
									placeholder="Contoh: MTR-001"
									className="tabular-nums"
								/>
							</div>
						</>
					)}

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="grid gap-1.5">
							<Label htmlFor="user-email" className="text-sm font-medium">
								Email <span className="font-normal text-muted-foreground">(opsional)</span>
							</Label>
							<Input
								id="user-email"
								type="email"
								value={form.email}
								onChange={(e) => setField("email", e.target.value)}
								placeholder="nama@contoh.id"
							/>
						</div>
						<div className="grid gap-1.5">
							<Label htmlFor="user-telepon" className="text-sm font-medium">
								Telepon <span className="font-normal text-muted-foreground">(opsional)</span>
							</Label>
							<Input
								id="user-telepon"
								value={form.telepon}
								onChange={(e) => setField("telepon", e.target.value)}
								placeholder="+62 ..."
								className="tabular-nums"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="cursor-pointer text-xs">
							Batal
						</Button>
						<Button type="submit" disabled={isSaving} className="cursor-pointer text-xs">
							{isSaving ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" /> Menyimpan...
								</>
							) : isEdit ? (
								"Simpan Perubahan"
							) : (
								"Buat Akun"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

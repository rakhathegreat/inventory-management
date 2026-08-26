import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth/auth";
import {
	createUser,
	deleteUser,
	fetchUsers,
	updateUser,
	type ManagedUser,
	type UserPayload,
} from "../api/userApi";

/** Kredensial plaintext yang baru dibuat/direset — hanya ada di memori untuk modal receipt. */
export interface SuccessCredential {
	nama: string;
	username: string;
	role: string;
	password: string;
}

export function useManajemenUser() {
	const { user: currentUser } = useAuth();
	const [users, setUsers] = useState<ManagedUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successCredential, setSuccessCredential] = useState<SuccessCredential | null>(null);

	const load = async () => {
		setIsLoading(true);
		setError(null);
		try {
			setUsers(await fetchUsers());
		} catch (e: any) {
			setError(e.message || "Gagal memuat daftar user.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const handleCreate = async (payload: UserPayload) => {
		await createUser(payload);
		setSuccessCredential({
			nama: payload.nama || payload.username,
			username: payload.username,
			role: payload.role,
			password: payload.password || "",
		});
		toast.success("User baru berhasil ditambahkan");
		await load();
	};

	const handleUpdate = async (id: string, payload: Partial<UserPayload>) => {
		await updateUser(id, payload);
		toast.success("Perubahan berhasil disimpan");
		await load();
	};

	const handleResetPassword = async (user: ManagedUser, password: string) => {
		await updateUser(user.id, { password });
		setSuccessCredential({
			nama: user.profile?.nama || user.username,
			username: user.username,
			role: user.role,
			password,
		});
		toast.success("Password berhasil direset");
	};

	const handleToggleActive = async (user: ManagedUser) => {
		if (user.id === currentUser?.id) return;
		try {
			await updateUser(user.id, { isAktif: !user.isAktif });
			toast.success(`Akun ${user.profile?.nama || user.username} ${user.isAktif ? "dinonaktifkan" : "diaktifkan"}`);
			await load();
		} catch (e: any) {
			toast.error(e.message || "Gagal mengubah status akun");
		}
	};

	const handleDelete = async (user: ManagedUser) => {
		if (user.id === currentUser?.id) return;
		try {
			await deleteUser(user.id);
			toast.success(`Akun ${user.profile?.nama || user.username} dihapus`);
			await load();
		} catch (e: any) {
			toast.error(e.message || "Gagal menghapus user");
		}
	};

	return {
		users,
		currentUserId: currentUser?.id ?? null,
		isLoading,
		error,
		successCredential,
		setSuccessCredential,
		reload: load,
		handleCreate,
		handleUpdate,
		handleResetPassword,
		handleToggleActive,
		handleDelete,
	};
}

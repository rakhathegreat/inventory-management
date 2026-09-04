import * as React from "react";
import { KeyRound, Plus, Power, RotateCcw, Search, Trash2, Users, UserPen, X } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, createRowActionsColumn, type RowAction } from "@/shared/ui/data-table/DataTable";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/shared/lib/utils";
import { useManajemenUser } from "./hooks/useManajemenUser";
import type { ManagedUser, UserPayload } from "./api/userApi";
import { DEFAULT_PASSWORD, suggestUsername } from "./utils/credentials";
import { ROLE_META, toBackendRole, type BackendRole } from "./components/role-meta";
import { UserFormModal } from "./components/UserFormModal";
import { UserSuccessModal } from "./components/UserSuccessModal";

export const ROLE_TABS = [
	{ key: "all", label: "Semua" },
	{ key: "ADMIN", label: "Admin" },
	{ key: "INTERNAL", label: "Internal" },
	{ key: "MITRA", label: "Mitra" },
] as const;

export type RoleTabKey = (typeof ROLE_TABS)[number]["key"];

const STATUS_FILTERS = [
	{ key: "all", label: "Semua" },
	{ key: "active", label: "Aktif" },
	{ key: "inactive", label: "Nonaktif" },
] as const;

function RoleBadge({ role }: { role: ManagedUser["role"] }) {
	const meta = ROLE_META[toBackendRole(role)];
	return (
		<Badge variant="secondary" className={cn("px-2 py-0.5 text-[11px] font-medium", meta.badge)}>
			{meta.label}
		</Badge>
	);
}

function activePalette(meta: { badge: string }): string {
	return meta.badge;
}

/** Halaman Manajemen User (admin-only): daftar akun + tambah/edit/reset/hapus. */
export default function ManajemenUserPage() {
	const {
		users,
		currentUserId,
		isLoading,
		error,
		successCredential,
		setSuccessCredential,
		reload,
		handleCreate,
		handleUpdate,
		handleResetPassword,
		handleToggleActive,
		handleDelete,
		handleBulkDeactivate,
		handleBulkDelete,
	} = useManajemenUser();

	const [searchQuery, setSearchQuery] = React.useState("");
	const [roleTab, setRoleTab] = React.useState<RoleTabKey>("all");
	const [statusFilter, setStatusFilter] = React.useState<(typeof STATUS_FILTERS)[number]["key"]>("all");
	const [formOpen, setFormOpen] = React.useState(false);
	const [editingUser, setEditingUser] = React.useState<ManagedUser | null>(null);
	const [resetTarget, setResetTarget] = React.useState<ManagedUser | null>(null);
	const [deleteTarget, setDeleteTarget] = React.useState<ManagedUser | null>(null);
	const [bulkDeleteIds, setBulkDeleteIds] = React.useState<string[] | null>(null);

	const counts = React.useMemo(() => {
		const acc: Record<RoleTabKey, number> = { all: users.length, ADMIN: 0, INTERNAL: 0, MITRA: 0 };
		for (const u of users) {
			const role = toBackendRole(u.role);
			if (role in acc) acc[role] += 1;
		}
		return acc;
	}, [users]);

	const filteredUsers = React.useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return users.filter((u) => {
			const matchesSearch =
				q === "" ||
				u.username.toLowerCase().includes(q) ||
				(u.profile?.nama || "").toLowerCase().includes(q);
			const matchesRole = roleTab === "all" || u.role === roleTab;
			const matchesStatus =
				statusFilter === "all" || (statusFilter === "active") === u.isAktif;
			return matchesSearch && matchesRole && matchesStatus;
		});
	}, [users, searchQuery, roleTab, statusFilter]);

	const openAdd = () => {
		setEditingUser(null);
		setFormOpen(true);
	};

	const openEdit = (user: ManagedUser) => {
		setEditingUser(user);
		setFormOpen(true);
	};

	const handleFormSubmit = async (payload: Omit<UserPayload, "username" | "password">) => {
		if (editingUser) {
			await handleUpdate(editingUser.id, payload);
			return;
		}
		// Username dibuat dari nama; password awal sama untuk semua akun
		// (DEFAULT_PASSWORD) — tampil di modal receipt dan bisa diganti
		// user sendiri setelah login.
		const username = suggestUsername(payload.nama, users.map((u) => u.username));
		await handleCreate({ ...payload, username, password: DEFAULT_PASSWORD });
	};

	const columns = React.useMemo<ColumnDef<ManagedUser, any>[]>(
		() => [
			{
				id: "nama",
				header: () => <span>Nama</span>,
				cell: ({ row }) => (
					<span className="text-sm font-medium text-foreground">
						{row.original.profile?.nama || "—"}
					</span>
				),
			},
			{
				id: "username",
				header: () => <span>Username</span>,
				cell: ({ row }) => (
					<span className="font-mono text-xs text-muted-foreground">{row.original.username}</span>
				),
			},
			{
				id: "role",
				header: () => <span className="flex justify-center">Role</span>,
				cell: ({ row }) => (
					<div className="flex justify-center">
						<RoleBadge role={row.original.role} />
					</div>
				),
			},
			{
				id: "email",
				header: () => <span>Email</span>,
				cell: ({ row }) => {
					const email = row.original.profile?.email;
					return email && email !== "-" ? (
						<span className="truncate text-xs text-muted-foreground">{email}</span>
					) : (
						<span className="text-xs text-muted-foreground">—</span>
					);
				},
			},
			{
				id: "telepon",
				header: () => <span>Telepon</span>,
				cell: ({ row }) => {
					const phone = row.original.profile?.telepon;
					return phone && phone !== "-" ? (
						<span className="text-xs tabular-nums text-muted-foreground">{phone}</span>
					) : (
						<span className="text-xs text-muted-foreground">—</span>
					);
				},
			},
			{
				id: "status",
				header: () => <span>Status</span>,
				meta: { className: "w-24 text-center" },
				cell: ({ row }) =>
					row.original.isAktif ? (
						<Badge variant="secondary" className="bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
							Aktif
						</Badge>
					) : (
						<Badge variant="outline" className="px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
							Nonaktif
						</Badge>
					),
			},
			createRowActionsColumn<ManagedUser>((u) => {
				const isSelf = u.id === currentUserId;
				const actions: RowAction<ManagedUser>[] = [
					{ label: "Edit Akun", icon: UserPen, onClick: () => openEdit(u) },
				];
				if (!isSelf) {
					actions.push(
						{ label: "Reset Password", icon: KeyRound, onClick: () => setResetTarget(u) },
						{
							label: u.isAktif ? "Nonaktifkan" : "Aktifkan",
							icon: Power,
							onClick: () => handleToggleActive(u),
						},
						{ label: "Hapus", icon: Trash2, destructive: true, onClick: () => setDeleteTarget(u) },
					);
				}
				return actions;
			}),
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentUserId],
	);

	const hasActiveFilter = searchQuery !== "" || roleTab !== "all" || statusFilter !== "all";

	if (error && !isLoading) {
		return (
			<div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center p-6">
				<div className="rounded-xl border border-dashed px-8 py-12 text-center">
					<p className="text-sm font-medium text-foreground">Daftar user gagal dimuat</p>
					<p className="mt-1 max-w-sm text-xs text-muted-foreground">{error}</p>
					<Button variant="outline" size="sm" className="mt-4 cursor-pointer gap-2 text-xs" onClick={() => reload()}>
						Coba lagi
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-5 overflow-y-auto p-6">
			<header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-xl font-semibold tracking-tight text-foreground">Manajemen User</h1>
					<p className="mt-1 max-w-xl text-sm text-muted-foreground">
						Kelola akun admin, staf internal, dan mitra beserta status aktifnya.
					</p>
				</div>
				<Button size="sm" className="h-9 cursor-pointer gap-2" onClick={openAdd}>
					<Plus className="size-4" /> Tambah Akun
				</Button>
			</header>

			{/* Tipe user: tabs */}
			<div className="flex flex-col gap-3">
				<Tabs value={roleTab} onValueChange={(val) => setRoleTab(val as RoleTabKey)}>
					<TabsList variant="line" className="w-full">
						{ROLE_TABS.map(({ key, label }) => {
							const count = counts[key];
							return (
								<TabsTrigger key={key} value={key} className="gap-1.5">
									{label}
									{count > 0 && (
										<span
											className={cn(
												"inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
												key === "all"
													? "bg-muted text-muted-foreground"
													: activePalette(ROLE_META[key as BackendRole]),
											)}>
											{count}
										</span>
									)}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</Tabs>
			</div>

			{/* Toolbar: pencarian + status filter */}
			<div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
				<div className="relative w-full lg:max-w-sm lg:flex-1">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Cari nama atau username..."
						className="pl-9 pr-8 text-xs"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery !== "" && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							aria-label="Bersihkan pencarian"
							className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
							<X className="size-3.5" />
						</button>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2 lg:ml-auto">
					<Select
						value={statusFilter}
						onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}>
						<SelectTrigger
							aria-label="Filter status akun"
							className={cn(
								"w-36 cursor-pointer text-xs",
								statusFilter === "all" && "text-muted-foreground",
							)}>
							<Power className="size-3.5 shrink-0 text-muted-foreground" />
							<SelectValue placeholder="Semua status" />
						</SelectTrigger>
						<SelectContent className="text-xs">
							{STATUS_FILTERS.map(({ key, label }) => (
								<SelectItem key={key} value={key} className="cursor-pointer text-xs">
									{label === "Semua" ? "Semua status" : label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{hasActiveFilter && (
						<Button
							variant="ghost"
							size="sm"
							className="h-9 cursor-pointer gap-1.5 px-2.5 text-xs text-muted-foreground"
							onClick={() => {
								setSearchQuery("");
								setRoleTab("all");
								setStatusFilter("all");
							}}>
							<RotateCcw className="size-3.5" /> Reset
						</Button>
					)}
				</div>
			</div>

			{/* Tabel user */}
			<DataTable<ManagedUser>
				data={filteredUsers}
			enableSelection
			getRowId={(row) => row.id}
				bulkActions={[
					{
						label: "Nonaktifkan",
						icon: Power,
						onAction: handleBulkDeactivate,
					},
					{
						label: "Hapus",
						icon: Trash2,
						destructive: true,
						onAction: (ids) => setBulkDeleteIds(ids),
					},
				]}
				columns={columns}
				isLoading={isLoading}
				pagination="client"
				className="pb-10"
				emptyState={{
					icon: Users,
					title: hasActiveFilter ? "Tidak ada user yang cocok" : "Belum ada user terdaftar",
					description: hasActiveFilter
						? "Tidak ditemukan akun sesuai kata kunci atau filter saat ini."
						: "Tambahkan akun pertama agar bisa digunakan untuk login.",
					action: hasActiveFilter ? (
						<Button
							variant="outline"
							size="sm"
							className="cursor-pointer text-xs"
onClick={() => {
							setSearchQuery("");
							setRoleTab("all");
							setStatusFilter("all");
						}}>
							Bersihkan filter
						</Button>
					) : (
						<Button size="sm" className="cursor-pointer gap-2 text-xs" onClick={openAdd}>
							<Plus className="size-3.5" /> Tambah Akun
						</Button>
					),
				}}
			/>

			<UserFormModal
				isOpen={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditingUser(null);
				}}
				user={editingUser}
				defaultRole={roleTab === "all" ? null : (roleTab as BackendRole)}
				currentUserId={currentUserId}
				isSaving={isLoading}
				onSubmit={handleFormSubmit}
			/>

			<AlertDialog open={resetTarget !== null} onOpenChange={(open) => !open && setResetTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base">Reset password akun ini?</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
							Password <strong>{resetTarget?.username}</strong> akan diubah ke{" "}
							<strong className="font-mono">{DEFAULT_PASSWORD}</strong>. Berikan kredensial ini kepada
							yang bersangkutan — ia bisa menggantinya sendiri setelah login.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel className="cursor-pointer text-xs">Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (resetTarget) handleResetPassword(resetTarget, DEFAULT_PASSWORD);
								setResetTarget(null);
							}}
							className="cursor-pointer text-xs">
							<KeyRound className="mr-2 size-4" /> Reset Password
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<UserSuccessModal credential={successCredential} onClose={() => setSuccessCredential(null)} />

			<AlertDialog open={bulkDeleteIds !== null} onOpenChange={(open) => !open && setBulkDeleteIds(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base">Hapus {bulkDeleteIds?.length} akun terpilih?</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
							Akun yang dipilih akan dihapus permanen dan tidak dapat digunakan untuk login lagi.
							Tindakan ini tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel className="cursor-pointer text-xs">Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (bulkDeleteIds) handleBulkDelete(bulkDeleteIds);
								setBulkDeleteIds(null);
							}}
							className="cursor-pointer bg-destructive text-xs text-white hover:bg-destructive/90">
							Hapus Akun
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="text-base">
							Hapus akun {deleteTarget?.profile?.nama || deleteTarget?.username}?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-xs">
							Akun <strong>{deleteTarget?.username}</strong> akan dihapus permanen dan tidak dapat
							digunakan untuk login lagi. Tindakan ini tidak dapat dibatalkan.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2">
						<AlertDialogCancel className="cursor-pointer text-xs">Batal</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deleteTarget) handleDelete(deleteTarget);
								setDeleteTarget(null);
							}}
							className="cursor-pointer bg-destructive text-xs text-white hover:bg-destructive/90">
							Hapus Akun
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

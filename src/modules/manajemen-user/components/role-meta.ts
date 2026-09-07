export const ROLE_META = {
	ADMIN: { label: "Admin", badge: "bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
	INTERNAL: { label: "Internal", badge: "bg-violet-500/10 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
	MITRA: { label: "Mitra", badge: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
} as const;

export type BackendRole = keyof typeof ROLE_META;

/** Normalisasi role dari berbagai bentuk input (enum backend / teks bebas). */
export function toBackendRole(role: string): BackendRole {
	const r = role.trim().toUpperCase();
	if (r === "ADMIN") return "ADMIN";
	if (r === "INTERNAL") return "INTERNAL";
	return "MITRA";
}

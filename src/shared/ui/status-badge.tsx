import {
	AlertTriangle,
	CircleDashed,
	Navigation,
	Search,
	CheckCircle2,
	XCircle,
	Clock,
	HelpCircle,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type StatusType = string;

type StatusSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
	/** Status key, matched case-insensitively against the config (e.g. "in progress", "In Progress"). */
	status: StatusType;
	/** Override the displayed text. */
	label?: string;
	/** Override the leading icon. */
	icon?: LucideIcon;
	/** Visual size. */
	size?: StatusSize;
	className?: string;
}

/**
 * Central configuration: each status maps to a display label, a lucide icon,
 * and a capsule class. Light mode uses a soft 10% tint fill with a darker ink;
 * dark mode uses the low-opacity 950 fill tinted to match the text/icon.
 */
const STATUS_CONFIG: Record<
	string,
	{ label: string; icon: LucideIcon; className: string }
> = {
	// ── Primary workflow statuses ──
	pending: {
		label: "Pending",
		icon: AlertTriangle,
		className:
			"bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-500",
	},
	"in progress": {
		label: "In Progress",
		icon: CircleDashed,
		className:
			"bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
	},
	submitted: {
		label: "Submitted",
		icon: Navigation,
		className:
			"bg-purple-500/10 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
	},
	"in review": {
		label: "In Review",
		icon: Search,
		className:
			"bg-yellow-500/10 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-500",
	},
	success: {
		label: "Success",
		icon: CheckCircle2,
		className:
			"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	},
	failed: {
		label: "Failed",
		icon: XCircle,
		className:
			"bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
	},
	expired: {
		label: "Expired",
		icon: Clock,
		className:
			"bg-zinc-500/10 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400",
	},

	// ── Inventory aliases (keep existing usages resolving) ──
	menunggu: {
		label: "Menunggu",
		icon: AlertTriangle,
		className:
			"bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-500",
	},
	siap: {
		label: "Siap",
		icon: Search,
		className:
			"bg-yellow-500/10 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-500",
	},
	tersedia: {
		label: "Tersedia",
		icon: CheckCircle2,
		className:
			"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	},
	selesai: {
		label: "Selesai",
		icon: CheckCircle2,
		className:
			"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	},
	diterima: {
		label: "Diterima",
		icon: CheckCircle2,
		className:
			"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	},
	bekas: {
		label: "Bekas",
		icon: CheckCircle2,
		className:
			"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	},
	aktif: {
		label: "Aktif",
		icon: CheckCircle2,
		className:
			"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	},
	terdistribusi: {
		label: "Terdistribusi",
		icon: CircleDashed,
		className:
			"bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
	},
	digunakan: {
		label: "Digunakan",
		icon: CircleDashed,
		className:
			"bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
	},
	baru: {
		label: "Baru",
		icon: Navigation,
		className:
			"bg-purple-500/10 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
	},
	hilang: {
		label: "Hilang",
		icon: XCircle,
		className:
			"bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
	},
	rusak: {
		label: "Rusak",
		icon: XCircle,
		className:
			"bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
	},
	ditolak: {
		label: "Ditolak",
		icon: XCircle,
		className:
			"bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
	},
	dibatalkan: {
		label: "Dibatalkan",
		icon: XCircle,
		className:
			"bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
	},
	disetujui: {
		label: "Disetujui",
		icon: CheckCircle2,
		className:
			"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
	},
	serah: {
		label: "Serah",
		icon: Navigation,
		className:
			"bg-purple-500/10 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
	},
	// Kunci memakai format hasil `normalize()` (spasi) agar lookup tidak gagal
	"menunggu scan penerima": {
		label: "Menunggu Scan Penerima",
		icon: Clock,
		className:
			"bg-purple-500/10 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
	},
	tolak: {
		label: "Ditolak",
		icon: XCircle,
		className:
			"bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
	},
	nonaktif: {
		label: "Nonaktif",
		icon: Clock,
		className:
			"bg-zinc-500/10 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400",
	},
};

const NEUTRAL: { label: string; icon: LucideIcon; className: string } = {
	label: "Unknown",
	icon: HelpCircle,
	className:
		"bg-zinc-500/10 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400",
};

const SIZE_CLASS: Record<StatusSize, { wrap: string; icon: string }> = {
	sm: { wrap: "text-xs px-2 py-1.5 gap-1.5 rounded-md", icon: "size-3.5" },
	md: { wrap: "text-sm px-2.5 py-1 gap-1.5", icon: "size-4" },
	lg: { wrap: "text-base px-3 py-1.5 gap-2", icon: "size-5" },
};

const normalize = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ");

const toTitleCase = (value: string) =>
	value
		.toLowerCase()
		.split(/[\s_-]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

export function StatusBadge({
	status,
	label,
	icon,
	size = "md",
	className,
}: StatusBadgeProps) {
	const config = STATUS_CONFIG[normalize(status)] ?? {
		...NEUTRAL,
		label: toTitleCase(status),
	};
	const Icon = icon ?? config.icon;
	const text = label ?? config.label;
	const sizing = SIZE_CLASS[size];

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-lg font-medium whitespace-nowrap leading-none",
				config.className,
				sizing.wrap,
				className,
			)}>
			<Icon
				className={cn(sizing.icon, "shrink-0 self-center")}
				aria-hidden="true"
			/>
			<span className="inline-flex items-center leading-none">{text}</span>
		</span>
	);
}

/**
 * Demo: renders every configured status plus override and fallback examples
 * on a neutral surface that follows the active theme.
 */
export function StatusBadgeDemo() {
	const samples: {
		status: string;
		size?: StatusSize;
		label?: string;
		icon?: LucideIcon;
	}[] = [
		{ status: "pending" },
		{ status: "in progress" },
		{ status: "submitted" },
		{ status: "in review" },
		{ status: "success" },
		{ status: "failed" },
		{ status: "expired" },
		{ status: "unknown-status" },
		{ status: "success", size: "sm", label: "Done", icon: CheckCircle2 },
		{ status: "failed", size: "lg" },
	];

	return (
		<div className="flex flex-wrap items-center gap-3 bg-zinc-100 p-6 rounded-xl dark:bg-zinc-950">
			{samples.map((sample, index) => (
				<StatusBadge key={index} {...sample} />
			))}
		</div>
	);
}

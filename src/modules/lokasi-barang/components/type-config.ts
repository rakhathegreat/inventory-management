import { Archive, Layers, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const STORAGE_TYPES = ["Rak", "Kardus", "Pallet"] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];

export interface StorageTypeConfig {
	icon: LucideIcon;
	/** Warna teks ikon & penanda tipe. */
	text: string;
	/** Latar chip ikon. */
	chipBg: string;
	/** Warna dasar progress bar untuk tipe ini. */
	bar: string;
}

/**
 * Satu sumber kebenaran identitas visual per tipe penyimpanan.
 * Dipakai oleh kartu, statistik, dropdown, dan badge agar warna konsisten.
 */
export const TYPE_CONFIG: Record<StorageType, StorageTypeConfig> = {
	Rak: {
		icon: Layers,
		text: "text-blue-500",
		chipBg: "bg-blue-500/10",
		bar: "bg-blue-500",
	},
	Kardus: {
		icon: Archive,
		text: "text-amber-500",
		chipBg: "bg-amber-500/10",
		bar: "bg-amber-500",
	},
	Pallet: {
		icon: Package,
		text: "text-emerald-500",
		chipBg: "bg-emerald-500/10",
		bar: "bg-emerald-500",
	},
};

export function getTypeConfig(type: string): StorageTypeConfig {
	return TYPE_CONFIG[type as StorageType] ?? TYPE_CONFIG.Kardus;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { InterMitraRequest } from "../types";
import { fetchInterMitraRequests, updateInterMitraStatus } from "../api/peminjamanMitraApi";

const STATUS_TABS = ["Semua", "Menunggu", "Disetujui", "Serah", "Selesai", "Ditolak / Dibatalkan"] as const;
export type InterMitraTab = (typeof STATUS_TABS)[number];

export function usePeminjamanMitra() {
	const [requests, setRequests] = useState<InterMitraRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selected, setSelected] = useState<InterMitraRequest | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [activeTab, setActiveTab] = useState<InterMitraTab>("Semua");
	const [actionId, setActionId] = useState<string | null>(null);

	const load = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await fetchInterMitraRequests();
			setRequests(data);
			return data;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Gagal memuat data permintaan antar mitra.");
			return null;
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const runAction = useCallback(
		async (id: string, status: string, notes?: string | null) => {
			setActionId(id);
			try {
				await updateInterMitraStatus(id, status, notes);
				const fresh = await load();
				toast.success(
					status === "DISETUJUI"
						? "Permintaan disetujui"
						: status === "DITOLAK"
							? "Permintaan ditolak"
							: "Status permintaan diperbarui",
				);
				// Sinkronkan drawer dengan data terbaru dari server (bukan patch stubs)
				if (fresh) {
					setSelected((current) => {
						if (!current || current.id !== id) return current;
						return fresh.find((r) => r.id === id) ?? current;
					});
				}
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Gagal mengubah status permintaan");
			} finally {
				setActionId(null);
			}
		},
		[load],
	);

	const filtered = useMemo(() => {
		let data = requests;
		if (activeTab !== "Semua") {
			if (activeTab === "Ditolak / Dibatalkan") {
				data = data.filter((r) => ["DITOLAK", "DIBATALKAN"].includes(r.status.toUpperCase()));
			} else {
				data = data.filter((r) => r.status.toUpperCase() === activeTab.toUpperCase());
			}
		}
		if (searchTerm.trim()) {
			const q = searchTerm.toLowerCase();
			data = data.filter(
				(r) =>
					r.requestNumber?.toLowerCase().includes(q) ||
					r.requesterName?.toLowerCase().includes(q) ||
					r.providerName?.toLowerCase().includes(q) ||
					r.notes?.toLowerCase().includes(q),
			);
		}
		return [...data].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
	}, [requests, activeTab, searchTerm]);

	return {
		requests,
		isLoading,
		selected,
		setSelected,
		searchTerm,
		setSearchTerm,
		activeTab,
		setActiveTab,
		actionId,
		runAction,
		filtered,
		reload: load,
	};
}
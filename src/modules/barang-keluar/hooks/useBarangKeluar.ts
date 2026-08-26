import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import type {
	InventoryItem,
	KodeBarangUpdate,
} from "@/shared/types/inventory";
import type { BarangKeluarItem } from "@/modules/transaksi/types";
import {
	fetchActivePartners,
	fetchAllItems,
	fetchLocationsRaw,
	fetchTransactionsRaw,
	createTransactionRecord,
	updateItemOutboundStatus,
} from "../api/barangKeluarApi";
import {
	compareFifoItems,
	findOlderFifoItem,
	getFifoToastDescription,
	getQueuedSerialNumbers,
	isOutsideStatus,
	normalizeKodeBarang,
} from "../utils/outbound";

/** Deteksi target input teks agar scanner global tidak membajak ketikan manual. */
const isTextInputTarget = (target: EventTarget | null) => {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(target.closest("input, textarea, [contenteditable='true']"));
};

export function useBarangKeluar() {
	const [kodeBarang, setKodeBarang] = useState("");
	const [barangKeluar, setBarangKeluar] = useState<BarangKeluarItem[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);
	const kodeBarangRef = useRef("");
	const [dbItems, setDbItems] = useState<InventoryItem[]>([]);
	const [dbPartners, setDbPartners] = useState<ReturnType<typeof Object>[]>([] as any);
	const [selectedPartnerId, setSelectedPartnerId] = useState("");
	const [keterangan, setKeterangan] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const items = await fetchAllItems();
				setDbItems(items);

				const activePartners = await fetchActivePartners();
				setDbPartners(activePartners as any);
				if (activePartners.length === 1) {
					setSelectedPartnerId(activePartners[0].id);
				}

				const locationsData = await fetchLocationsRaw();
				void locationsData; // dipakai bila tampilan kuota diaktifkan kembali
			} catch (error) {
				console.error("Gagal mengambil data dari server:", error);
				toast.error("Gagal memuat data barang keluar.");
			}
		};
		loadInitialData();
	});

	const updateKodeBarang = useCallback((value: KodeBarangUpdate) => {
		const nextValue =
			typeof value === "function" ? value(kodeBarangRef.current) : value;
		kodeBarangRef.current = nextValue;
		setKodeBarang(nextValue);
	}, []);

	const focusKodeBarangInput = useCallback(() => {
		setTimeout(() => inputRef.current?.focus(), 0);
	}, []);

	// Auto-focus pada input ketika component mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSubmit = useCallback(
		(kodeOverride = kodeBarang) => {
			const trimmedKode = kodeOverride.trim();
			if (!trimmedKode) return;

			updateKodeBarang("");

			const selectedPartner = dbPartners.find(
				(partner: any) => partner.id === selectedPartnerId,
			);
			const targetMitraName = selectedPartner?.name;

			if (!targetMitraName) {
				toast.error("Pilih mitra tujuan sebelum menambahkan barang keluar.");
				focusKodeBarangInput();
				return;
			}

			const isDuplicate = barangKeluar.some(
				(item) =>
					normalizeKodeBarang(item.nomor) === normalizeKodeBarang(trimmedKode),
			);
			if (isDuplicate) {
				toast.error("Serial number sudah ada di sesi ini.", { description: trimmedKode });
				focusKodeBarangInput();
				return;
			}

			const matchedItem = dbItems.find(
				(item) =>
					normalizeKodeBarang(item.serialNumber) ===
					normalizeKodeBarang(trimmedKode),
			);
			if (!matchedItem) {
				toast.error("Data serial number tidak ditemukan.", { description: trimmedKode });
				focusKodeBarangInput();
				return;
			}

			if (isOutsideStatus(matchedItem.status)) {
				toast.error(
					"Barang ini sudah berada di luar dan tidak dapat dikeluarkan kembali.",
					{ description: `Status saat ini: ${matchedItem.status}` },
				);
				focusKodeBarangInput();
				return;
			}

			const queuedSerialNumbers = getQueuedSerialNumbers(barangKeluar);
			const olderFifoItem = findOlderFifoItem(dbItems, matchedItem, queuedSerialNumbers);
			if (olderFifoItem) {
				toast.error("FIFO aktif: keluarkan barang yang lebih lama terlebih dahulu.", {
					description: getFifoToastDescription(olderFifoItem),
				});
				focusKodeBarangInput();
				return;
			}

			const originalLoc = matchedItem.lokasiPenyimpanan || "-";
			const newItem: BarangKeluarItem = {
				id: Date.now(),
				nomor: trimmedKode,
				merek: matchedItem.merek || "-",
				kategori: matchedItem.kategori || "-",
				tipe: matchedItem.tipe || undefined,
				lokasi: originalLoc as any,
				mitra: targetMitraName,
				keterangan: "",
				status: "Valid",
			};

			setBarangKeluar((current) => [newItem, ...current]);

			focusKodeBarangInput();
		},
		[
			barangKeluar,
			dbItems,
			dbPartners,
			focusKodeBarangInput,
			kodeBarang,
			selectedPartnerId,
			updateKodeBarang,
		],
	);

	// Scanner global: blind scan tanpa klik input
	useEffect(() => {
		const handleWindowKeyDown = (event: KeyboardEvent) => {
			if (
				event.defaultPrevented ||
				event.ctrlKey ||
				event.metaKey ||
				event.altKey ||
				event.isComposing
			) {
				return;
			}

			const isSupportedKey =
				event.key.length === 1 || event.key === "Backspace" || event.key === "Enter";
			if (!isSupportedKey || isTextInputTarget(event.target)) {
				return;
			}

			if (document.querySelector("[data-slot='select-content']")) {
				return;
			}

			event.preventDefault();
			inputRef.current?.focus();

			if (event.key === "Enter") {
				handleSubmit(kodeBarangRef.current);
				return;
			}

			if (event.key === "Backspace") {
				updateKodeBarang((current) => current.slice(0, -1));
				return;
			}

			updateKodeBarang((current) => `${current}${event.key}`);
		};

		window.addEventListener("keydown", handleWindowKeyDown);
		return () => window.removeEventListener("keydown", handleWindowKeyDown);
	}, [handleSubmit, updateKodeBarang]);

	const handleDeleteItem = (id: number) => {
		setBarangKeluar((current) => current.filter((item) => item.id !== id));
	};

	const handleValidateAll = async () => {
		if (isSaving) return;
		setIsSaving(true);
		try {
			const sessionDate = new Date().toISOString().slice(0, 10);
			const dateStr = sessionDate.replace(/-/g, "");

			// Nomor urut harian OUT-YYYYMMDD-NNNN (jalur legacy; intake baru memakai endpoint bulk)
			const txs = await fetchTransactionsRaw();
			const prefix = `OUT-${dateStr}-`;
			let maxNum = 0;
			txs.forEach((t: any) => {
				if (t.nomor && t.nomor.startsWith(prefix)) {
					const num = parseInt(t.nomor.slice(prefix.length), 10);
					if (!isNaN(num) && num > maxNum) maxNum = num;
				}
			});
			const sessionNomor = `${prefix}${(maxNum + 1).toString().padStart(4, "0")}`;

			const latestItems = await fetchAllItems();
			const latestVisibleItems = latestItems;

			const findLatestSessionItem = (nomor: string) =>
				latestVisibleItems.find(
					(dbItem) =>
						normalizeKodeBarang(dbItem.serialNumber) ===
						normalizeKodeBarang(nomor),
				);

			const invalidItem = barangKeluar.find((item) => {
				const latestItem = findLatestSessionItem(item.nomor);
				return !latestItem || isOutsideStatus(latestItem.status);
			});

			if (invalidItem) {
				const latestItem = findLatestSessionItem(invalidItem.nomor);
				toast.error(
					latestItem
						? "Barang yang sudah berada di luar tidak dapat dikeluarkan kembali."
						: "Data barang tidak lagi ditemukan di data master.",
					{ description: invalidItem.nomor },
				);
				setDbItems(latestVisibleItems);
				return;
			}

			const queuedSerialNumbers = getQueuedSerialNumbers(barangKeluar);
			const fifoInvalidItem = barangKeluar.find((item) => {
				const latestItem = findLatestSessionItem(item.nomor);
				return latestItem
					? Boolean(findOlderFifoItem(latestVisibleItems, latestItem, queuedSerialNumbers))
					: false;
			});

			if (fifoInvalidItem) {
				const latestItem = findLatestSessionItem(fifoInvalidItem.nomor);
				const olderFifoItem = latestItem
					? findOlderFifoItem(latestVisibleItems, latestItem, queuedSerialNumbers)
					: undefined;

				toast.error("FIFO aktif: masih ada barang lama yang harus keluar lebih dulu.", {
					description: olderFifoItem
						? getFifoToastDescription(olderFifoItem)
						: fifoInvalidItem.nomor,
				});
				setDbItems(latestVisibleItems);
				return;
			}

			const fifoSortedBarangKeluar = [...barangKeluar].sort((a, b) => {
				const itemA = findLatestSessionItem(a.nomor);
				const itemB = findLatestSessionItem(b.nomor);
				if (!itemA || !itemB) return 0;
				return compareFifoItems(itemA, itemB);
			});

			for (const item of fifoSortedBarangKeluar) {
				const originalItem = findLatestSessionItem(item.nomor)!;
				const originalLoc = originalItem.lokasiPenyimpanan || "-";
				const updatedItem: InventoryItem & { paNumber?: string } = {
					...originalItem,
					status: "Keluar",
					lokasiPenyimpanan: "Keluar",
					tanggalKeluar: sessionDate,
					mitra: item.mitra,
					paNumber: undefined,
				};
				await updateItemOutboundStatus(updatedItem.id, updatedItem, item.nomor);

				const newTransaction = {
					id: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
					tanggal: sessionDate,
					nomor: sessionNomor,
					kategori: "Keluar",
					status: "Selesai",
					sn: item.nomor,
					merek: item.merek,
					asal: originalLoc,
					tujuan: item.mitra,
					mitra: item.mitra,
					keterangan: null,
				};
				await createTransactionRecord(newTransaction, item.nomor);
			}
			toast.success(`${barangKeluar.length} barang keluar berhasil disimpan.`);

			// Refresh data master setelah simpan
			const refreshedItems = await fetchAllItems();
			setDbItems(refreshedItems);
		} catch (error) {
			console.error("Gagal menyimpan ke database:", error);
			toast.error("Gagal menyimpan barang keluar ke database.");
		} finally {
			setIsSaving(false);
		}
	};

	return {
		kodeBarang,
		updateKodeBarang,
		inputRef,
		kodeBarangRef,
		handleSubmit,
		focusKodeBarangInput,
		dbPartners,
		selectedPartnerId,
		setSelectedPartnerId,
		keterangan,
		setKeterangan,
		setBarangKeluar,
		barangKeluar,
		handleDeleteItem,
		handleValidateAll,
		isSaving,
	};
}

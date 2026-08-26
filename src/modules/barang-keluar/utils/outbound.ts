import type { InventoryItem } from "@/shared/types/inventory";
import type { BarangKeluarItem } from "@/modules/transaksi/types";

export const ADMIN_LOCATION = "KP Tasikmalaya";

export const normalizeKodeBarang = (code?: string | null) =>
	(code || "").trim().toUpperCase();
export const normalizeStatus = (status: string) =>
	status.trim().toLocaleLowerCase("id-ID");
export const normalizeText = (text?: string | null) =>
	(text || "").trim().toLocaleLowerCase("id-ID");
export const normalizeOwner = (owner?: string | null) =>
	normalizeText(owner || ADMIN_LOCATION);

/** Status yang berarti unit sudah tidak berada di gudang. */
export function isOutsideStatus(status: string): boolean {
	const normalized = normalizeStatus(status);
	return (
		normalized === "keluar" ||
		normalized === "diluar" ||
		normalized === "terdistribusi"
	);
}

const getEntryDateTime = (item: InventoryItem) => {
	const parsedTime = Date.parse(item.tanggalMasuk);
	return Number.isFinite(parsedTime) ? parsedTime : Number.MAX_SAFE_INTEGER;
};

export const compareFifoItems = (a: InventoryItem, b: InventoryItem) => {
	const dateDiff = getEntryDateTime(a) - getEntryDateTime(b);
	if (dateDiff !== 0) return dateDiff;
	return normalizeKodeBarang(a.serialNumber).localeCompare(
		normalizeKodeBarang(b.serialNumber),
	);
};

const isSameFifoGroup = (item: InventoryItem, referenceItem: InventoryItem) =>
	normalizeText(item.merek) === normalizeText(referenceItem.merek) &&
	normalizeText(item.kategori) === normalizeText(referenceItem.kategori) &&
	normalizeOwner(item.mitra) === normalizeOwner(referenceItem.mitra);

export const getQueuedSerialNumbers = (items: BarangKeluarItem[]) =>
	new Set(items.map((item) => normalizeKodeBarang(item.nomor)).filter(Boolean));

/** FIFO: cari item seumuran-grup yang lebih tua & belum keluar selain yang discan. */
export function findOlderFifoItem(
	items: InventoryItem[],
	requestedItem: InventoryItem,
	queuedSerialNumbers: Set<string>,
): InventoryItem | undefined {
	const requestedSerial = normalizeKodeBarang(requestedItem.serialNumber);
	const requestedEntryTime = getEntryDateTime(requestedItem);

	return items
		.filter((item) => {
			const itemSerial = normalizeKodeBarang(item.serialNumber);
			return (
				itemSerial &&
				itemSerial !== requestedSerial &&
				!queuedSerialNumbers.has(itemSerial) &&
				!isOutsideStatus(item.status) &&
				isSameFifoGroup(item, requestedItem) &&
				getEntryDateTime(item) < requestedEntryTime
			);
		})
		.sort(compareFifoItems)[0];
}

const formatTanggalMasuk = (tanggal: string) => {
	if (!tanggal) return "tanggal masuk belum tersedia";
	const [datePart] = tanggal.split("T");
	return datePart || tanggal;
};

export const getFifoToastDescription = (olderItem: InventoryItem) =>
	`Scan ${olderItem.serialNumber} terlebih dahulu (masuk ${formatTanggalMasuk(
		olderItem.tanggalMasuk,
	)}, lokasi ${olderItem.lokasiPenyimpanan || "-"}).`;

/**
 * Sisa kapasitas per lokasi (level rak di-explicit ke "Rak - Level")
 * berdasar item aktif yang masih di dalam gudang.
 */
export function computeOutboundKuota(
	locationsData: any[],
	items: InventoryItem[],
	locationOwner: string,
): Record<string, number> {
	const kuota: Record<string, number> = {};
	(Array.isArray(locationsData) ? locationsData : []).forEach((loc: any) => {
		if (loc.name === "Keluar" || loc.name === "Diluar") return;
		if (
			(loc.owner || "KP Tasikmalaya").trim().toLowerCase() !==
			locationOwner.trim().toLowerCase()
		) {
			return;
		}

		const countActiveAt = (name: string) =>
			items.filter((item: any) => {
				if (!item.lokasiPenyimpanan) return false;
				const st = (item.status || "").trim().toLowerCase();
				return (
					item.lokasiPenyimpanan.trim() === name.trim() &&
					st !== "diluar" &&
					st !== "keluar" &&
					st !== "terdistribusi"
				);
			}).length;

		if (loc.type === "Rak" && loc.levels) {
			loc.levels.forEach((lvl: any) => {
				const name = `${loc.name} - ${lvl.name}`;
				kuota[name] = Math.max(0, lvl.capacity - countActiveAt(name));
			});
		} else {
			kuota[loc.name] = Math.max(0, (loc.capacity || 0) - countActiveAt(loc.name));
		}
	});
	return kuota;
}


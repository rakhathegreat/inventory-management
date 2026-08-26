import type { BarangUnit, StatusUnit } from "@/shared/types/inventory";

export const STATUS_OPTIONS: Array<StatusUnit | "Digunakan"> = [
	"Tersedia",
	"Terdistribusi",
	"Digunakan",
	"Rusak",
	"Hilang",
];

export interface BarangFormData {
	serialNumber: string;
	kategori: string;
	merek: string;
	tipe: string;
	status: StatusUnit;
	kondisi: string;
	lokasiPenyimpanan: string;
}

/**
 * Validasi form unit barang. PURE.
 */
export function validateBarangForm(
	form: BarangFormData,
): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!form.serialNumber.trim())
		errors.serialNumber = "Serial number wajib diisi";
	if (!form.kategori.trim()) errors.kategori = "Kategori wajib diisi";
	if (!form.merek.trim()) errors.merek = "Merek barang wajib diisi";
	if (!form.lokasiPenyimpanan.trim())
		errors.lokasiPenyimpanan = "Lokasi penyimpanan wajib diisi";
	return errors;
}

export function formatTanggal(tgl: string): string {
	if (!tgl) return "-";
	const date = new Date(tgl);
	if (isNaN(date.getTime())) return tgl;
	return date.toLocaleDateString("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

const EXPORT_COLUMN_LABELS: Record<string, (item: BarangUnit) => any> = {
	serialNumber: (item) => ["Serial Number (SN)", item.serialNumber],
	kategori: (item) => ["Kategori Material", item.kategori],
	merek: (item) => ["Merek", item.merek],
	tipe: (item) => ["Model / Tipe", item.tipe || "-"],
	status: (item) => ["Status Barang", item.status],
	lokasiPenyimpanan: (item) => ["Lokasi Penyimpanan", item.lokasiPenyimpanan],
	tanggalMasuk: (item) => ["Tanggal Masuk", formatTanggal(item.tanggalMasuk)],
	tanggalKeluar: (item) => [
		"Tanggal Keluar",
		item.tanggalKeluar ? formatTanggal(item.tanggalKeluar) : "-",
	],
};

/**
 * Petakan daftar unit ke baris excel sesuai kolom terpilih. PURE.
 */
export function mapItemsToExportRows(
	items: BarangUnit[],
	selectedColumns: string[],
): Record<string, any>[] {
	return items.map((item) => {
		const row: Record<string, any> = {};
		selectedColumns.forEach((colKey) => {
			const mapper = EXPORT_COLUMN_LABELS[colKey];
			if (mapper) {
				const [label, value] = mapper(item);
				row[label] = value;
			} else {
				row[colKey] = (item as any)[colKey];
			}
		});
		return row;
	});
}

export function buildExportFileName(now = new Date()): string {
	return `Data_Barang_Arxiva_${now.toISOString().split("T")[0]}.xlsx`;
}

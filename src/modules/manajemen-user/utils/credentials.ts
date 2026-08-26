/** Password awal yang sama untuk semua akun baru/reset — diganti sendiri oleh user kemudian. */
export const DEFAULT_PASSWORD = "Taslim123!";

/** Username otomatis dari nama: "PT TZU" → "pt_tzu", unik terhadap daftar yang ada. */
export function suggestUsername(nama: string, takenUsernames: Iterable<string>): string {
	const taken = new Set(takenUsernames);
	const base =
		nama
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "") || "user";

	let candidate = base;
	let suffix = 1;
	while (taken.has(candidate)) {
		suffix += 1;
		candidate = `${base}${suffix}`;
	}
	return candidate;
}

import { Combobox, type ComboboxItem } from "@/shared/ui/combobox";

interface ModelSelectPopoverProps {
	value: string;
	onChange: (val: string) => void;
	onCloseFocus?: () => void;
	placeholder?: string;
	onSearch: (query: string) => Promise<ComboboxItem[]>;
}

export function ModelSelectPopover({
	value,
	onChange,
	onCloseFocus,
	placeholder = "Pilih Model",
	onSearch,
}: ModelSelectPopoverProps) {
	return (
		<Combobox
			value={value}
			onChange={onChange}
			onSearch={onSearch}
			placeholder={placeholder}
			searchPlaceholder="Cari nama model / merek..."
			emptyText="Model tidak ditemukan"
			recentKey="model"
			onOpenChange={(open) => {
				if (!open) {
					setTimeout(() => onCloseFocus?.(), 0);
				}
			}}
		/>
	);
}
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Search, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

export interface ComboboxItem {
	value: string;
	label: string;
	description?: string;
}

interface ComboboxProps {
	items?: ComboboxItem[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	idleHint?: string;
	disabled?: boolean;
	className?: string;
	onOpenChange?: (open: boolean) => void;
	onSearch?: (query: string) => Promise<ComboboxItem[]>;
	debounceMs?: number;
	minQueryLength?: number;
	recentKey?: string;
}

const PANEL_OFFSET = 6;
const PANEL_MAX = 320;
const PANEL_MIN = 120;
const RECENT_PREFIX = "arxiva-recents:";
const RECENT_MAX = 5;

function readRecents(key: string): ComboboxItem[] {
	try {
		const raw = localStorage.getItem(`${RECENT_PREFIX}${key}`);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed)
			? parsed.filter(
					(item: unknown) =>
						typeof item === "object" &&
						item !== null &&
						typeof (item as ComboboxItem).value === "string",
				)
			: [];
	} catch {
		return [];
	}
}

function pushRecent(key: string, item: ComboboxItem) {
	try {
		const next = [item, ...readRecents(key).filter((r) => r.value !== item.value)].slice(
			0,
			RECENT_MAX,
		);
		localStorage.setItem(`${RECENT_PREFIX}${key}`, JSON.stringify(next));
	} catch {
		// Abaikan gangguan localStorage (privacy mode, kuota, dll).
	}
}

interface PanelPos {
	top?: number;
	bottom?: number;
	left: number;
	width: number;
	maxHeight: number;
}

export function Combobox({
	items = [],
	value,
	onChange,
	placeholder = "Pilih...",
	searchPlaceholder = "Cari...",
	emptyText = "Tidak ditemukan",
	idleHint = "Ketik untuk mencari...",
	disabled = false,
	className,
	onOpenChange: onOpenChangeProp,
	onSearch,
	debounceMs = 300,
	minQueryLength = 1,
	recentKey,
}: ComboboxProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [activeIndex, setActiveIndex] = useState(0);
	const [pos, setPos] = useState<PanelPos | null>(null);
	const [options, setOptions] = useState<ComboboxItem[]>([]);
	const [recents, setRecents] = useState<ComboboxItem[]>(() =>
		recentKey ? readRecents(recentKey) : [],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestRef = useRef(0);

	const anchorRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

	const listboxId = useId();
	const optionBaseId = useId();

	const isAsync = typeof onSearch === "function";

	// Mode sinkron: filter client-side dari items.
	const filteredItems = useMemo(() => {
		if (isAsync) return [];
		if (!query.trim()) return items;
		const q = query.trim().toLowerCase();
		return items.filter(
			(item) =>
				item.label.toLowerCase().includes(q) ||
				(item.description || "").toLowerCase().includes(q),
		);
	}, [isAsync, items, query]);

	// Saat idle (belum mengetik): tampilkan pilihan terakhir dari storage.
	const isIdle = isAsync && query.trim().length < minQueryLength;

	// Mode async: hasil dari server, atau recents saat idle.
	const displayItems = isIdle
		? recents
		: isAsync
			? options
			: filteredItems;

	const selectedItem = useMemo(() => {
		if (isAsync) {
			return (
				options.find((item) => item.value === value) ||
				(value ? { value, label: value } : undefined)
			);
		}
		return items.find((item) => item.value === value);
	}, [isAsync, items, options, value]);

	const updatePosition = useCallback(() => {
		const el = anchorRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const viewportH = window.innerHeight;
		const spaceBelow = viewportH - rect.bottom - PANEL_OFFSET;
		const spaceAbove = rect.top - PANEL_OFFSET;
		const clamp = (space: number) =>
			Math.max(PANEL_MIN, Math.min(PANEL_MAX, space));
		if (spaceBelow >= 260 || spaceBelow >= spaceAbove) {
			setPos({
				top: rect.bottom + PANEL_OFFSET,
				left: rect.left,
				width: rect.width,
				maxHeight: clamp(spaceBelow),
			});
		} else {
			setPos({
				bottom: viewportH - rect.top + PANEL_OFFSET,
				left: rect.left,
				width: rect.width,
				maxHeight: clamp(spaceAbove),
			});
		}
	}, []);

	const close = useCallback(() => {
		requestRef.current += 1;
		setOpen(false);
		setQuery("");
		setActiveIndex(0);
		onOpenChangeProp?.(false);
	}, [onOpenChangeProp]);

	const openField = useCallback(() => {
		if (disabled || open) return;
		requestRef.current += 1;
		setOpen(true);
		setQuery("");
		setActiveIndex(0);
		setError(null);
		if (recentKey) setRecents(readRecents(recentKey));
		onOpenChangeProp?.(true);
	}, [disabled, open, recentKey, onOpenChangeProp]);

	const select = useCallback(
		(item: ComboboxItem) => {
			onChange(item.value);
			if (recentKey) pushRecent(recentKey, item);
			close();
		},
		[onChange, recentKey, close],
	);

	const handleClear = useCallback(() => {
		if (value) {
			onChange("");
			close();
		} else {
			setQuery("");
			setActiveIndex(0);
		}
	}, [value, onChange, close]);

	// Debounced pencarian server (mode async).
	useEffect(() => {
		if (!isAsync || !open) return;
		const q = query.trim();
		if (q.length < minQueryLength) {
			setIsLoading(false);
			setError(null);
			return;
		}
		const requestId = ++requestRef.current;
		setIsLoading(true);
		setError(null);
		const timer = setTimeout(async () => {
			try {
				const result = await onSearch!(q);
				if (requestRef.current !== requestId) return;
				setOptions(result);
				setError(null);
			} catch (err) {
				if (requestRef.current !== requestId) return;
				setError("Gagal memuat data. Coba lagi.");
			} finally {
				if (requestRef.current === requestId) setIsLoading(false);
			}
		}, debounceMs);
		return () => clearTimeout(timer);
	}, [isAsync, open, query, minQueryLength, debounceMs, onSearch]);

	// Keep the shelf anchored to the field while open.
	useEffect(() => {
		if (!open) return;
		updatePosition();
		const onScroll = () => updatePosition();
		const onResize = () => updatePosition();
		window.addEventListener("scroll", onScroll, true);
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("scroll", onScroll, true);
			window.removeEventListener("resize", onResize);
		};
	}, [open, updatePosition]);

	// Close on any pointer press outside the control or its shelf.
	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (
				panelRef.current?.contains(target) ||
				anchorRef.current?.contains(target)
			) {
				return;
			}
			close();
		};
		document.addEventListener("pointerdown", onPointerDown, true);
		return () =>
			document.removeEventListener("pointerdown", onPointerDown, true);
	}, [open, close]);

	// Escape closes even when focus moved onto an option.
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.stopPropagation();
			close();
			anchorRef.current?.querySelector("input")?.focus();
		};
		document.addEventListener("keydown", onKeyDown, true);
		return () => document.removeEventListener("keydown", onKeyDown, true);
	}, [open, close]);

	// Keep the active row in view; clamp when results shrink.
	useEffect(() => {
		if (!open) return;
		if (displayItems.length === 0) {
			setActiveIndex(0);
		} else if (activeIndex >= displayItems.length) {
			setActiveIndex(displayItems.length - 1);
		} else {
			optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
		}
	}, [open, displayItems, activeIndex]);

	const handleInputKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Tab") {
				close();
				return;
			}
			if (event.key === "ArrowDown" && !open) {
				event.preventDefault();
				openField();
				return;
			}
			if (!open) return;
			if (displayItems.length === 0) return;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					setActiveIndex((i) => (i + 1) % displayItems.length);
					break;
				case "ArrowUp":
					event.preventDefault();
					setActiveIndex(
						(i) => (i - 1 + displayItems.length) % displayItems.length,
					);
					break;
				case "Home":
					event.preventDefault();
					setActiveIndex(0);
					break;
				case "End":
					event.preventDefault();
					setActiveIndex(displayItems.length - 1);
					break;
				case "Enter": {
					event.preventDefault();
					const target = displayItems[activeIndex] ?? displayItems[0];
					if (target) select(target);
					break;
				}
				case "Escape":
					event.preventDefault();
					close();
					break;
			}
		},
		[open, displayItems, activeIndex, openField, select, close],
	);

	const inputText = open
		? query
		: selectedItem
			? selectedItem.description
				? `${selectedItem.label} (${selectedItem.description})`
				: selectedItem.label
			: "";

	const inputPlaceholder = open ? searchPlaceholder : value ? "" : placeholder;

	const renderOption = (item: ComboboxItem, index: number) => {
		const isSelected = value === item.value;
		const isActive = index === activeIndex;
		return (
			<div
				key={item.value}
				id={`${optionBaseId}-${index}`}
				role="option"
				aria-selected={isSelected}
				ref={(el) => {
					optionRefs.current[index] = el;
				}}
				className={cn(
					"flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-xs outline-none transition-colors",
					isActive
						? "bg-accent text-accent-foreground"
						: "hover:bg-accent/60",
					isSelected && "text-primary",
				)}
				onMouseEnter={() => setActiveIndex(index)}
				onMouseDown={(event) => event.preventDefault()}
				onClick={() => select(item)}>
				<div className="flex min-w-0 gap-2">
					<span className="">{item.label}</span>
					{item.description && (
						<span className="text-[11px] text-muted-foreground">
							{item.description}
						</span>
					)}
				</div>
				{isSelected && <Check className="size-4 shrink-0 text-primary" />}
			</div>
		);
	};

	return (
		<div ref={anchorRef} className={cn("relative", className)}>
			<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				role="combobox"
				type="text"
				autoComplete="off"
				aria-expanded={open}
				aria-controls={open ? listboxId : undefined}
				aria-autocomplete="list"
				aria-activedescendant={
					open && displayItems[activeIndex]
						? `${optionBaseId}-${activeIndex}`
						: undefined
				}
				value={inputText}
				onChange={(event) => {
					setQuery(event.target.value);
					setActiveIndex(0);
				}}
				onFocus={openField}
				onClick={openField}
				onKeyDown={handleInputKeyDown}
				placeholder={inputPlaceholder}
				disabled={disabled}
				className="pr-8 pl-8"
			/>
			{!disabled && (value !== "" || query !== "") && (
				<button
					type="button"
					aria-label={value ? "Hapus pilihan" : "Bersihkan pencarian"}
					onClick={(event) => {
						event.stopPropagation();
						handleClear();
					}}
					className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground">
					<X className="size-3.5" />
				</button>
			)}

			{open &&
				pos &&
				createPortal(
					<div
						ref={panelRef}
						id={listboxId}
						role="listbox"
						className="animate-in fade-in-0 zoom-in-95 duration-100 fixed z-50 overflow-y-auto rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 mt-1 motion-reduce:animate-none"
						style={{
							top: pos.top,
							bottom: pos.bottom,
							left: pos.left,
							width: pos.width,
							maxHeight: `${pos.maxHeight}px`,
						}}>
						{isIdle && !isLoading ? (
							recents.length > 0 ? (
								<>
									<div className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
										Terakhir dipilih
									</div>
									{recents.map(renderOption)}
								</>
							) : (
								<div className="p-3 text-center text-xs text-muted-foreground">
									{idleHint}
								</div>
							)
						) : error ? (
							<div className="p-3 text-center text-xs text-destructive">
								{error}
							</div>
						) : isLoading && displayItems.length === 0 ? (
							<div className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground">
								<Loader2 className="size-3.5 animate-spin" />
								Memuat...
							</div>
						) : displayItems.length === 0 ? (
							<div className="p-3 text-center text-xs text-muted-foreground">
								{emptyText}
							</div>
						) : (
							<>
								{isLoading && (
									<div className="flex items-center justify-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
										<Loader2 className="size-3.5 animate-spin" />
										Memuat...
									</div>
								)}
								{displayItems.map(renderOption)}
							</>
						)}
					</div>,
					document.body,
				)}
		</div>
	);
}
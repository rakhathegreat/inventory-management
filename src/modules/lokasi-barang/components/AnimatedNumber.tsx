import { useEffect, useRef, useState } from "react";

/** Angka dengan animasi count-up halus setiap kali `value` berubah. */
export function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
	const [display, setDisplay] = useState(0);
	const displayRef = useRef(0);
	useEffect(() => {
		let frame: number;
		let start: number | null = null;
		const from = displayRef.current;
		const delta = value - from;
		if (delta === 0) return;
		const step = (timestamp: number) => {
			if (start === null) start = timestamp;
			const progress = Math.min((timestamp - start) / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
			setDisplay(Math.round(from + delta * eased));
			if (progress < 1) frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	}, [value, duration]);
	displayRef.current = display;
	return <>{display.toLocaleString("id-ID")}</>;
}

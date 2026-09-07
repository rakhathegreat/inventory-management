import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
	"group/badge inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium leading-none whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
	{
		variants: {
			variant: {
				default: "bg-primary/10 text-primary [a]:hover:bg-primary/15",
				secondary:
					"bg-zinc-500/10 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400",
				destructive:
					"bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 [a]:hover:bg-rose-500/15",
				outline:
					"bg-muted/20 text-foreground [a]:hover:bg-muted/40 [a]:hover:text-muted-foreground",
				ghost:
					"text-foreground hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
				success:
					"bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
				info: "bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
				warning:
					"bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-500",
				danger:
					"bg-red-500/10 text-red-700 dark:bg-red-950/40 dark:text-red-400",
				neutral: "bg-zinc-500/10 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400",
			},
			size: {
				sm: "text-xs px-2 py-1.5 gap-1.5 rounded-md [&>svg]:size-3.5!",
				md: "text-sm px-2.5 py-1 gap-1.5 [&>svg]:size-4!",
				lg: "text-base px-3 py-1.5 gap-2 [&>svg]:size-5!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "sm",
		},
	},
);

export type BadgeVariant = NonNullable<
	VariantProps<typeof badgeVariants>["variant"]
>;

export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>;

function Badge({
	className,
	variant = "default",
	size = "sm",
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "span";

	return (
		<Comp
			data-slot="badge"
			data-variant={variant}
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };

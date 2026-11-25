/**
 * Button — botón base del formulario.
 * Variantes solid / outline / ghost sobre los tokens del tema.
 */
import { cn } from "../utils/cn";

const VARIANTS = {
	solid:
		"bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
	outline:
		"border border-border bg-transparent text-foreground hover:bg-secondary",
	ghost:
		"bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary",
};

export function Button({
	as: Component = "button",
	variant = "solid",
	className,
	type,
	...props
}) {
	return (
		<Component
			data-nexui="button"
			type={Component === "button" ? (type ?? "button") : type}
			className={cn(
				"inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)]",
				"px-4 py-2.5 text-sm font-medium transition-colors duration-150",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
				"disabled:pointer-events-none disabled:opacity-40",
				VARIANTS[variant],
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Textarea — campo de texto largo para indicaciones especiales.
 */
import { forwardRef } from "react";
import { cn } from "../utils/cn";

export const Textarea = forwardRef(function Textarea(
	{ className, ...props },
	ref,
) {
	return (
		<textarea
			ref={ref}
			data-nexui="textarea"
			className={cn(
				"min-h-32 w-full resize-y rounded-[var(--radius)] border border-input bg-input/40 px-4 py-3",
				"text-base text-foreground placeholder:text-muted-foreground",
				"transition-colors duration-150",
				"focus-visible:bg-input/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				className,
			)}
			{...props}
		/>
	);
});

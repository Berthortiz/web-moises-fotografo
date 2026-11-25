/**
 * TextareaStep — campo de texto largo para indicaciones especiales.
 */
import { useEffect, useRef } from "react";
import { Textarea } from "../nexui/Textarea";
import { Button } from "../nexui/Button";
import { cn } from "../utils/cn";

export default function TextareaStep({
	step,
	value,
	onChange,
	onAdvance,
	error,
	isPreview = false,
}) {
	const textareaRef = useRef(null);

	useEffect(() => {
		if (!isPreview) textareaRef.current?.focus();
	}, [isPreview]);

	const length = (value ?? "").length;

	return (
		<div className="flex w-full max-w-lg flex-col gap-4">
			<div data-stagger>
				<Textarea
					ref={textareaRef}
					placeholder={step.placeholder || ""}
					value={value ?? ""}
					onChange={(event) => onChange(event.target.value)}
					maxLength={step.max}
					rows={5}
					className={cn(
						error &&
							"border-destructive focus-visible:ring-destructive",
					)}
					aria-invalid={Boolean(error)}
					aria-label={step.question}
					tabIndex={isPreview ? -1 : undefined}
				/>
				{step.max && (
					<p className="mt-1 text-right text-xs text-muted-foreground">
						{length}/{step.max}
					</p>
				)}
			</div>
			{error && (
				<p
					data-stagger
					role="alert"
					className="text-sm font-medium text-destructive"
				>
					{error}
				</p>
			)}
			<div data-stagger className="flex items-center gap-3">
				<Button onClick={onAdvance}>
					{step.required === false ? "Omitir / Siguiente →" : "Siguiente →"}
				</Button>
				<span className="text-xs text-muted-foreground">
					o presiona{" "}
					<kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">
						Enter ↵
					</kbd>
				</span>
			</div>
		</div>
	);
}

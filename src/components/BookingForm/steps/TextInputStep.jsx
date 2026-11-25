/**
 * TextInputStep — campo de texto corto estilo Typeform.
 * Foco automático al entrar; Enter o el botón OK avanzan.
 */
import { useEffect, useRef } from "react";
import { Input } from "../../nexui/Input";
import { Button } from "../../nexui/Button";
import { cn } from "../../../lib/cn";

export default function TextInputStep({
	step,
	value,
	onChange,
	onAdvance,
	error,
	isPreview = false,
}) {
	const inputRef = useRef(null);

	useEffect(() => {
		if (!isPreview) inputRef.current?.focus();
	}, [isPreview]);

	return (
		<div className="flex w-full max-w-lg flex-col gap-4">
			<div data-stagger>
				<Input
					ref={inputRef}
					type={step.inputType || "text"}
					placeholder={step.placeholder || ""}
					autoComplete={step.autoComplete || "off"}
					value={value ?? ""}
					onChange={(event) => onChange(event.target.value)}
					className={cn(
						"text-lg",
						error &&
							"border-destructive focus-visible:ring-destructive",
					)}
					aria-invalid={Boolean(error)}
					aria-label={step.question}
					tabIndex={isPreview ? -1 : undefined}
				/>
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
				<Button onClick={onAdvance} disabled={value === "" || value == null}>
					OK ✓
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

/**
 * SelectSingleStep — selección de opción única.
 * Al hacer clic se registra la selección y el contenedor avanza
 * automáticamente tras un micro-delay.
 */
import { RadioGroup } from "../../nexui/Radio";
import { Button } from "../../nexui/Button";

export default function SelectSingleStep({ step, value, onSelect, onAdvance }) {
	return (
		<div className="flex w-full max-w-lg flex-col gap-5">
			<div data-stagger>
				<RadioGroup
					options={step.options}
					value={value || null}
					onChange={onSelect}
				/>
			</div>
			<div data-stagger className="flex items-center gap-3">
				<Button onClick={onAdvance} disabled={!value}>
					Siguiente →
				</Button>
				<span className="text-xs text-muted-foreground">
					o presiona{" "}
					<kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">
						Enter
					</kbd>
				</span>
			</div>
		</div>
	);
}

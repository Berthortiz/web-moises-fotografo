/**
 * DatePickerStep — selección de fecha + hora.
 * La hora se elige de una rejilla de 24 opciones (00:00 a 23:00).
 * El valor se acumula como { date: "YYYY-MM-DD", time: "HH:mm" }.
 */
import { Calendar } from "../../nexui/Calendar";
import { Button } from "../../nexui/Button";
import { cn } from "../../../lib/cn";

const DEFAULT_TIMES = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

function formatSelectedDate(value) {
	if (!value) return null;
	return new Date(`${value}T00:00:00`).toLocaleDateString("es-US", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export default function DatePickerStep({
	step,
	value,
	onChange,
	onAdvance,
	error,
}) {
	const times = step.times?.length ? step.times : DEFAULT_TIMES;
	const selected = value || {};
	const formattedDate = formatSelectedDate(selected.date);

	return (
		<div className="flex w-full max-w-2xl flex-col gap-5">
			<div data-stagger className="grid gap-6 sm:grid-cols-2">
				<Calendar
					value={selected.date}
					minDate={step.minDate === null ? null : step.minDate}
					onChange={(date) =>
						onChange({ ...selected, date, time: selected.time })
					}
				/>

				<div className="flex min-w-0 flex-col gap-3">
					<div className="flex items-baseline justify-between gap-3">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Hora (24 h)
						</span>
						{formattedDate && (
							<span className="truncate text-xs text-muted-foreground">
								{formattedDate}
							</span>
						)}
					</div>

					<div
						role="radiogroup"
						aria-label="Horas disponibles"
						className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4"
					>
						{times.map((time) => {
							const isActive = selected.time === time;
							return (
								<button
									key={time}
									type="button"
									role="radio"
									aria-checked={isActive}
									disabled={!selected.date}
									onClick={() => onChange({ ...selected, time })}
									className={cn(
										"cursor-pointer rounded-lg border px-2 py-2 text-sm font-medium tabular-nums transition-colors",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
										"disabled:pointer-events-none disabled:opacity-30",
										isActive
											? "border-ring bg-primary/15 text-foreground"
											: "border-border text-muted-foreground hover:border-primary/50 hover:bg-secondary hover:text-foreground",
									)}
								>
									{time}
								</button>
							);
						})}
					</div>

					{!selected.date && (
						<span className="text-xs text-muted-foreground">
							Elige primero un día en el calendario
						</span>
					)}
				</div>
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
				<Button onClick={onAdvance} disabled={!selected.date || !selected.time}>
					Siguiente →
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

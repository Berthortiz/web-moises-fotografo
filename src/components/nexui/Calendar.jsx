/**
 * Calendar — selector de fecha mensual.
 * Reporta el día como string "YYYY-MM-DD" en horario local.
 * Por defecto deshabilita fechas pasadas; pasa `minDate={null}`
 * para permitir cualquier fecha.
 */
import { useState } from "react";
import { cn } from "../../lib/cn";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

function isoOf(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
		2,
		"0",
	)}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthGrid(view) {
	const year = view.getFullYear();
	const month = view.getMonth();
	const firstDayOfMonth = new Date(year, month, 1);
	const offset = (firstDayOfMonth.getDay() + 6) % 7;
	const grid = [];

	for (let i = 0; i < 42; i++) {
		const day = new Date(year, month, 1 - offset + i);
		grid.push({
			date: day,
			iso: isoOf(day),
			inMonth: day.getMonth() === month,
		});
	}

	return grid;
}

function startOfToday() {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	return date;
}

export function Calendar({ value, onChange, minDate } = {}) {
	const min =
		minDate === null
			? null
			: minDate
				? new Date(`${minDate}T00:00:00`)
				: startOfToday();
	const [view, setView] = useState(() =>
		value ? new Date(`${value}T00:00:00`) : new Date(),
	);
	const grid = buildMonthGrid(view);

	const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
	const todayISO = isoOf(startOfToday());
	const canGoBack =
		!min ||
		new Date(view.getFullYear(), view.getMonth(), 1) >
			new Date(min.getFullYear(), min.getMonth(), 1);

	return (
		<div data-nexui="calendar" className="w-full max-w-sm">
			<div className="mb-4 flex items-center justify-between">
				<button
					type="button"
					aria-label="Mes anterior"
					disabled={!canGoBack}
					onClick={() =>
						setView(
							new Date(view.getFullYear(), view.getMonth() - 1, 1),
						)
					}
					className="cursor-pointer rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
				>
					‹
				</button>
				<span className="text-sm font-semibold text-foreground">
					{MONTH_NAMES[view.getMonth()]} {view.getFullYear()}
				</span>
				<button
					type="button"
					aria-label="Mes siguiente"
					onClick={() =>
						setView(
							new Date(view.getFullYear(), view.getMonth() + 1, 1),
						)
					}
					className="cursor-pointer rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
				>
					›
				</button>
			</div>

			<div className="mb-2 grid grid-cols-7 gap-1">
				{WEEKDAYS.map((weekday) => (
					<span
						key={weekday}
						className="py-1 text-center text-xs font-medium text-muted-foreground"
					>
						{weekday}
					</span>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{grid.map(({ date, iso, inMonth }) => {
					const isDisabled = Boolean(min && date < min);
					const isSelected = selectedDate?.getTime() === date.getTime();
					const isToday = iso === todayISO;

					return (
						<button
							key={iso}
							type="button"
							disabled={isDisabled}
							onClick={() => onChange(iso)}
							aria-pressed={isSelected}
							className={cn(
								"aspect-square rounded-lg text-sm font-medium transition-colors",
								isDisabled && "pointer-events-none opacity-25",
								!isDisabled && "cursor-pointer hover:bg-secondary",
								!isDisabled && !inMonth && "text-muted-foreground/50",
								isSelected
									? "bg-primary text-primary-foreground hover:bg-primary/90"
									: isToday
										? "text-foreground ring-1 ring-ring/60"
										: inMonth && "text-foreground",
							)}
						>
							{date.getDate()}
						</button>
					);
				})}
			</div>
		</div>
	);
}

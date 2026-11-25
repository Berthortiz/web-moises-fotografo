/**
 * SummaryStep — resumen final con opción de editar cada respuesta.
 * El contenedor revalida todo antes de confirmar.
 */
import { Button } from "../../nexui/Button";
import { formatAnswer } from "../formatAnswers";

export default function SummaryStep({
	step,
	steps,
	answers,
	onEdit,
	canSubmit,
	onConfirm,
	isSubmitting = false,
	submitError = null,
}) {
	const answeredSteps = steps.filter((item) => item.type !== "summary_step");

	return (
		<div className="flex w-full max-w-lg flex-col gap-6">
			<div
				data-stagger
				className="divide-y divide-border overflow-hidden rounded-[var(--radius)] border border-border bg-secondary/40"
			>
				{answeredSteps.map((item) => {
					const text = formatAnswer(item, answers[item.id]);
					return (
						<div key={item.id} className="flex items-start gap-4 px-4 py-3">
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									{item.label || item.question}
								</p>
								<p
									className={`mt-1 break-words text-base ${
										text ? "text-foreground" : "text-muted-foreground"
									}`}
								>
									{text ||
										(item.required === false ? "—" : "Sin responder")}
								</p>
							</div>
							<Button
								variant="ghost"
								className="shrink-0 px-2 py-1 text-xs"
								onClick={() => onEdit(item.id)}
							>
								Editar
							</Button>
						</div>
					);
				})}
			</div>

			<div data-stagger>
				<Button
					onClick={onConfirm}
					disabled={!canSubmit || isSubmitting}
					className="w-full py-3.5 text-base"
				>
					{isSubmitting
						? "Enviando…"
						: step.submitLabel || "Confirmar solicitud ✓"}
				</Button>
				{submitError && (
					<p
						role="alert"
						className="mt-2 text-center text-sm font-medium text-destructive"
					>
						{submitError}
					</p>
				)}
				<p className="mt-2 text-center text-xs text-muted-foreground">
					{step.submitNote ||
						"Al confirmar, se abrirá WhatsApp con los detalles de tu solicitud."}
				</p>
			</div>
		</div>
	);
}

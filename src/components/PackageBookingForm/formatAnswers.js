/**
 * formatAnswers — helpers para mostrar respuestas y construir el mensaje
 * de WhatsApp a partir de la config y las respuestas acumuladas.
 */

export function formatAnswer(step, value) {
	if (value == null || value === "") return null;

	switch (step.type) {
		case "select_single": {
			const option = (step.options || []).find((item) =>
				typeof item === "string" ? item === value : item.value === value,
			);
			return typeof option === "string"
				? option
				: (option?.label ?? String(value));
		}
		case "date_picker": {
			if (!value.date) return null;
			const date = new Date(`${value.date}T00:00:00`);
			const formattedDate = date.toLocaleDateString("es-US", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			});
			return `${formattedDate}${value.time ? ` · ${value.time}` : ""}`;
		}
		default:
			return String(value);
	}
}

export function buildWhatsAppMessage(steps, answers) {
	const lines = ["*Nueva solicitud de paquete*", ""];

	for (const step of steps) {
		if (step.type === "summary_step") continue;
		const value = formatAnswer(step, answers[step.id]);
		if (!value) continue;
		lines.push(`${step.label || step.question}: ${value}`);
	}

	return lines.join("\n");
}

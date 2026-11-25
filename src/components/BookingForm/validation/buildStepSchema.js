/**
 * buildStepSchema — convierte la configuración de un paso en su schema Zod.
 * Es el puente entre la config declarativa y la validación runtime.
 */
import { z } from "zod";
import { RULES } from "./validators";

/** Fecha local de hoy como "YYYY-MM-DD". */
export function todayISO() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
		d.getDate(),
	).padStart(2, "0")}`;
}

/**
 * @param {object} step — paso de la configuración.
 * @returns {import("zod").ZodType} schema validador del valor del paso.
 */
export function buildStepSchema(step) {
	switch (step.type) {
		case "text_input":
		case "textarea_input": {
			let schema = (step.validate && RULES[step.validate]) || RULES.free;
			if (step.min != null) {
				schema = schema.min(step.min, `Mínimo ${step.min} caracteres`);
			}
			if (step.max != null) {
				schema = schema.max(step.max, `Máximo ${step.max} caracteres`);
			}
			return step.required === false
				? schema.optional().or(z.literal(""))
				: schema;
		}

		case "select_single": {
			const options = (step.options || []).map((option) =>
				typeof option === "string" ? option : option.value,
			);
			const schema = z
				.string({ message: "Selecciona una opción" })
				.refine(
					(value) => options.includes(value),
					"Selecciona una opción válida",
				);
			return step.required === false ? schema.optional() : schema;
		}

		case "date_picker": {
			const schema = z
				.object(
					{
						date: z
							.string({ message: "Selecciona una fecha" })
							.refine(
								(value) =>
									!Number.isNaN(
										new Date(`${value}T00:00:00`).getTime(),
									),
								"Selecciona una fecha",
							)
							.refine(
								(value) => value >= todayISO(),
								"No puedes reservar en fechas pasadas",
							),
						time: z
							.string({ message: "Selecciona una hora" })
							.min(1, "Selecciona una hora"),
					},
					{ message: "Selecciona fecha y hora" },
				)
				.refine(
					(value) => Boolean(value?.date && value?.time),
					"Completa fecha y hora",
				);
			return step.required === false ? schema.optional() : schema;
		}

		case "summary_step":
		default:
			return z.any().optional();
	}
}

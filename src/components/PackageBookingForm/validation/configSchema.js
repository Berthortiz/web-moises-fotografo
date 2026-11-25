/**
 * configSchema — guard de la configuración completa del formulario.
 * En desarrollo valida la config y muestra errores legibles en consola
 * para detectar pasos mal escritos antes de que rompan el flujo.
 */
import { z } from "zod";

const STEP_TYPES = [
	"select_single",
	"text_input",
	"textarea_input",
	"date_picker",
	"summary_step",
];

const stepSchema = z.object({
	id: z.string().min(1),
	type: z.enum(STEP_TYPES),
	question: z.string().min(1),
	required: z.boolean().optional(),
	label: z.string().optional(),
	validate: z.string().optional(),
	inputType: z.string().optional(),
	autoComplete: z.string().optional(),
	placeholder: z.string().optional(),
	submitLabel: z.string().optional(),
	submitNote: z.string().optional(),
	minDate: z.string().nullable().optional(),
	options: z
		.array(
			z.union([
				z.string(),
				z.object({ label: z.string(), value: z.string() }),
			]),
		)
		.optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	times: z.array(z.string()).optional(),
});

export const configSchema = z.object({
	title: z.string().min(1),
	successTitle: z.string().optional(),
	successMessage: z.string().optional(),
	submitMode: z.enum(["whatsapp", "endpoint", "demo"]).optional(),
	endpoint: z.string().optional(),
	whatsappNumber: z.string().optional(),
	steps: z
		.array(stepSchema)
		.min(2, "Debe haber al menos una pregunta y un resumen")
		.superRefine((steps, ctx) => {
			const seen = new Set();
			steps.forEach((step, index) => {
				if (seen.has(step.id)) {
					ctx.addIssue({
						code: "custom",
						message: `ID duplicado "${step.id}" en step ${index}`,
						path: ["steps", index, "id"],
					});
				}
				seen.add(step.id);
			});

			const summaries = steps.filter((step) => step.type === "summary_step");
			if (summaries.length !== 1) {
				ctx.addIssue({
					code: "custom",
					message: "Debe existir exactamente un summary_step",
					path: ["steps"],
				});
			}
			if (steps[steps.length - 1]?.type !== "summary_step") {
				ctx.addIssue({
					code: "custom",
					message: "El summary_step debe ser el último paso",
					path: ["steps"],
				});
			}

			steps.forEach((step, index) => {
				if (
					step.type === "select_single" &&
					(!step.options || step.options.length < 2)
				) {
					ctx.addIssue({
						code: "custom",
						message: `select_single "${step.id}" necesita al menos 2 opciones`,
						path: ["steps", index, "options"],
					});
				}
				if (
					step.type === "date_picker" &&
					step.times &&
					step.times.length === 0
				) {
					ctx.addIssue({
						code: "custom",
						message: `date_picker "${step.id}" no puede tener times vacíos`,
						path: ["steps", index, "times"],
					});
				}
			});
		}),
});

/** Valida en dev; devuelve true si la config es usable. */
export function assertConfig(config) {
	if (import.meta.env?.DEV !== true) return true;
	const result = configSchema.safeParse(config);
	if (result.success) return true;
	console.warn(
		"[PackageBookingForm] La config contiene errores:\n" +
			result.error.issues
				.map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
				.join("\n"),
	);
	return false;
}

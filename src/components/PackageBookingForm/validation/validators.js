/**
 * Reglas de validación nombradas (Zod), reutilizables por la config.
 * La config referencia estas reglas con `validate: "name"`, etc.
 * Todos los mensajes están en español, incluido el caso de campo vacío.
 */
import { z } from "zod";

export const RULES = {
	/** Nombre de persona: 2+ letras (permite tildes, ñ, espacios, apóstrofes) */
	name: z
		.string({ message: "Este campo es obligatorio" })
		.min(2, "Ingresa tu nombre completo")
		.regex(
			/^[a-zA-ZÀ-ÿ\u00f1\u00d1' .-]{2,60}$/,
			"El nombre solo puede contener letras y espacios",
		),

	/** Teléfono: + opcional, 7 a 20 caracteres con separadores */
	phone: z
		.string({ message: "Este campo es obligatorio" })
		.min(1, "Este campo es obligatorio")
		.regex(
			/^\+?[0-9 ()-]{7,20}$/,
			"Ingresa un teléfono válido (ej: +1 555 555 5555)",
		),

	/** Email */
	email: z
		.string({ message: "Este campo es obligatorio" })
		.min(1, "Este campo es obligatorio")
		.pipe(z.email({ message: "Ingresa un correo válido" })),

	/** Texto corto obligatorio genérico */
	text: z
		.string({ message: "Este campo es obligatorio" })
		.min(1, "Este campo es obligatorio"),

	/** Texto opcional genérico; el requerido se decide en buildStepSchema */
	free: z.string({ message: "Este campo es obligatorio" }),
};

import { WHATSAPP_NUMBER } from "../../../utils/whatsapp";

/** Horarios cada hora, de 00:00 a 23:00. */
const HOURS_24 = Array.from(
	{ length: 24 },
	(_, hour) => `${String(hour).padStart(2, "0")}:00`,
);

export const packageBookingConfig = {
	title: "Reserva tu paquete",
	successTitle: "¡Solicitud preparada!",
	successMessage:
		"Se abrió WhatsApp con el resumen de tu paquete. Envíalo desde allí y te responderé para confirmar los detalles.",
	submitMode: "whatsapp",
	whatsappNumber: WHATSAPP_NUMBER,
	steps: [
		{
			id: "package",
			type: "select_single",
			label: "Paquete",
			question: "¿Qué paquete te interesa?",
			required: true,
			options: [
				{ label: "White Package", value: "white-package" },
				{ label: "Black Package", value: "black-package" },
				{ label: "Black & White Plus", value: "black-white-plus" },
			],
		},
		{
			id: "name",
			type: "text_input",
			label: "Nombre",
			question: "¿Cuál es tu nombre completo?",
			required: true,
			validate: "name",
			autoComplete: "name",
			placeholder: "Tu nombre y apellido",
		},
		{
			id: "email",
			type: "text_input",
			label: "Correo",
			question: "¿Cuál es tu correo electrónico?",
			required: true,
			validate: "email",
			inputType: "email",
			autoComplete: "email",
			placeholder: "correo@ejemplo.com",
		},
		{
			id: "phone",
			type: "text_input",
			label: "Teléfono",
			question: "¿Cuál es tu teléfono?",
			required: true,
			validate: "phone",
			inputType: "tel",
			autoComplete: "tel",
			placeholder: "+1 555 555 5555",
		},
		{
			id: "datetime",
			type: "date_picker",
			label: "Fecha y hora",
			question: "¿Qué fecha y hora prefieres?",
			required: true,
			times: HOURS_24,
		},
		{
			id: "city",
			type: "text_input",
			label: "Ciudad / lugar",
			question: "¿En qué ciudad o lugar será el evento?",
			required: true,
			validate: "text",
			max: 120,
			placeholder: "Ciudad, estado o dirección",
		},
		{
			id: "message",
			type: "textarea_input",
			label: "Indicaciones especiales",
			question: "¿Alguna indicación especial?",
			required: false,
			validate: "text",
			max: 500,
			placeholder:
				"Cuéntame detalles importantes: tipo de evento, número de personas, referencias del lugar…",
		},
		{
			id: "summary",
			type: "summary_step",
			question: "Revisa y confirma tu solicitud",
			submitLabel: "Enviar solicitud por WhatsApp",
			submitNote:
				"Se abrirá WhatsApp con el resumen de tu solicitud para que la envíes.",
		},
	],
};

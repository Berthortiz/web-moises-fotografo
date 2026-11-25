/**
 * BookingForm — formulario multi-paso estilo Typeform.
 *
 * - Una pregunta a la vez, con transiciones GSAP.
 * - Validación Zod por paso y revalidación total antes de confirmar.
 * - Prefill del servicio desde la URL (`/reservas/?service=bodas`).
 * - Envío configurable:
 *   · `submitMode: "whatsapp"` (por defecto) abre WhatsApp con el resumen.
 *   · `submitMode: "endpoint"` hace POST a `config.endpoint`.
 *   · `onSubmit` permite integrarlo desde React.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildStepSchema } from "./validation/buildStepSchema";
import { assertConfig } from "./validation/configSchema";
import { useStepTransition } from "./hooks/useStepTransition";
import { buildWhatsAppMessage } from "./formatAnswers";
import StepRenderer from "./StepRenderer";
import ProgressBar from "./ProgressBar";
import SuccessScreen from "./SuccessScreen";
import { Button } from "../nexui/Button";

const AUTO_ADVANCE_DELAY = 250;

function optionValue(option) {
	return typeof option === "string" ? option : option.value;
}

function optionLabel(option) {
	return typeof option === "string" ? option : option.label;
}

export default function BookingForm({
	config,
	initialService,
	onSubmit,
}) {
	const steps = useMemo(() => config.steps ?? [], [config]);

	useEffect(() => {
		assertConfig(config);
	}, [config]);

	const [answers, setAnswers] = useState(() => {
		if (!initialService) return {};
		const serviceStep = steps.find((step) => step.id === "service");
		const valid = serviceStep?.options?.some(
			(option) => optionValue(option) === initialService,
		);
		return valid ? { service: initialService } : {};
	});
	const [prefilledService, setPrefilledService] = useState(
		initialService ?? null,
	);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [error, setError] = useState(null);
	const [submitted, setSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState(null);
	const [whatsappUrl, setWhatsappUrl] = useState(null);

	/** prevStepIndex != null → hay un paso saliente en pantalla. */
	const [prevStepIndex, setPrevStepIndex] = useState(null);
	/** Bloquea la navegación mientras corre la animación. */
	const animatingRef = useRef(false);
	const autoAdvanceRef = useRef(null);

	const containerRef = useStepTransition(
		currentIndex,
		prevStepIndex != null,
		direction,
		useCallback(() => {
			setPrevStepIndex(null);
			animatingRef.current = false;
		}, []),
	);

	const currentStep = steps[currentIndex];
	const totalSteps = steps.length;
	const isSummary = currentStep?.type === "summary_step";

	/**
	 * En Astro estático el query param no existe en build time, así que
	 * leemos `?service=` en el cliente al montar. Si el prop ya trae un
	 * servicio válido (SSR/uso directo), respetamos ese valor.
	 */
	useEffect(() => {
		if (typeof window === "undefined") return;
		const fromUrl = new URLSearchParams(window.location.search).get("service");
		if (!fromUrl) return;

		const serviceStep = steps.find((step) => step.id === "service");
		const valid = serviceStep?.options?.some(
			(option) => optionValue(option) === fromUrl,
		);
		if (!valid) return;

		setPrefilledService(fromUrl);
		setAnswers((previous) =>
			previous.service ? previous : { ...previous, service: fromUrl },
		);
	}, [steps]);

	const initialServiceLabel = useMemo(() => {
		if (!prefilledService) return null;
		const serviceStep = steps.find((step) => step.id === "service");
		const option = serviceStep?.options?.find(
			(item) => optionValue(item) === prefilledService,
		);
		return option ? optionLabel(option) : null;
	}, [prefilledService, steps]);

	/* ── Navegación ─────────────────────────────────────────── */

	const goTo = useCallback(
		(targetIndex) => {
			if (animatingRef.current || targetIndex === currentIndex) return;
			window.clearTimeout(autoAdvanceRef.current);
			setDirection(targetIndex > currentIndex ? 1 : -1);
			setPrevStepIndex(currentIndex);
			animatingRef.current = true;
			setCurrentIndex(targetIndex);
		},
		[currentIndex],
	);

	const handleBack = useCallback(() => {
		if (currentIndex > 0) goTo(currentIndex - 1);
	}, [currentIndex, goTo]);

	/* ── Validación Zod ─────────────────────────────────────── */

	const validateStep = useCallback((step, value) => {
		const result = buildStepSchema(step).safeParse(value);
		if (result.success) return { ok: true, message: null };
		return {
			ok: false,
			message: result.error.issues[0]?.message ?? "Respuesta no válida",
		};
	}, []);

	const handleAdvance = useCallback(
		(currentAnswers = answers) => {
			if (animatingRef.current || !currentStep) return;
			if (currentStep.type === "summary_step") return;

			const { ok, message } = validateStep(
				currentStep,
				currentAnswers[currentStep.id],
			);
			if (!ok) {
				setError(message);
				return;
			}

			setError(null);
			if (currentIndex + 1 < totalSteps) goTo(currentIndex + 1);
		},
		[answers, currentStep, currentIndex, goTo, totalSteps, validateStep],
	);

	/* ── Mutación de respuestas ─────────────────────────────── */

	const handleChange = useCallback(
		(value, { advance = false } = {}) => {
			if (!currentStep) return;
			const next = { ...answers, [currentStep.id]: value };
			setAnswers(next);
			setError(null);

			if (advance) {
				window.clearTimeout(autoAdvanceRef.current);
				autoAdvanceRef.current = window.setTimeout(
					() => handleAdvance(next),
					AUTO_ADVANCE_DELAY,
				);
			}
		},
		[answers, currentStep, handleAdvance],
	);

	useEffect(() => {
		return () => window.clearTimeout(autoAdvanceRef.current);
	}, []);

	/* ── Confirmar ──────────────────────────────────────────── */

	const handleConfirm = useCallback(async () => {
		if (submitted || isSubmitting) return;

		for (const [index, step] of steps.entries()) {
			if (step.type === "summary_step") continue;
			const { ok } = validateStep(step, answers[step.id]);
			if (!ok) {
				goTo(index);
				return;
			}
		}

		setSubmitError(null);

		try {
			if (onSubmit) {
				setIsSubmitting(true);
				await onSubmit(answers);
				setSubmitted(true);
				return;
			}

			if (config.submitMode === "endpoint") {
				if (!config.endpoint) {
					throw new Error("Falta configurar el endpoint de envío.");
				}
				setIsSubmitting(true);
				const response = await fetch(config.endpoint, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ answers }),
				});
				const data = await response.json().catch(() => ({}));
				if (!response.ok) {
					throw new Error(
						data?.error || "No se pudo enviar la solicitud. Inténtalo de nuevo.",
					);
				}
				setSubmitted(true);
				return;
			}

			if (config.submitMode === "whatsapp" && config.whatsappNumber) {
				const message = buildWhatsAppMessage(steps, answers);
				const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
					message,
				)}`;
				setWhatsappUrl(url);
				window.open(url, "_blank", "noopener,noreferrer");
				setSubmitted(true);
				return;
			}

			// Modo demo: el formulario funciona sin backend ni WhatsApp.
			setSubmitted(true);
		} catch (err) {
			setSubmitError(
				err instanceof Error
					? err.message
					: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		answers,
		config.endpoint,
		config.submitMode,
		config.whatsappNumber,
		goTo,
		isSubmitting,
		onSubmit,
		steps,
		submitted,
		validateStep,
	]);

	const canSubmit = useMemo(
		() =>
			steps.every((step) => {
				if (step.type === "summary_step") return true;
				return buildStepSchema(step).safeParse(answers[step.id]).success;
			}),
		[answers, steps],
	);

	/* ── Teclado global: Enter avanza · ArrowUp retrocede ───── */

	useEffect(() => {
		function onKeyDown(event) {
			if (submitted || animatingRef.current) return;

			const target = event.target;
			const insideForm = target?.closest?.('[data-nexui="booking-form"]');
			const isPageRoot =
				target === document.body || target === document.documentElement;
			// No secuestrar el teclado de enlaces/nav fuera del formulario.
			if (!insideForm && !isPageRoot) return;

			const tag = target?.tagName;

			if (event.key === "Enter") {
				if (tag === "BUTTON" || tag === "TEXTAREA" || tag === "A") return;
				event.preventDefault();
				if (isSummary) handleConfirm();
				else handleAdvance();
			} else if (
				event.key === "ArrowUp" &&
				tag !== "INPUT" &&
				tag !== "TEXTAREA"
			) {
				if (target?.closest?.('[data-nexui="calendar"]')) return;
				event.preventDefault();
				handleBack();
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handleAdvance, handleBack, handleConfirm, isSummary, submitted]);

	/* ── Render ─────────────────────────────────────────────── */

	if (submitted) {
		return <SuccessScreen config={config} whatsappUrl={whatsappUrl} />;
	}

	const renderStep = (index, slotProps) => (
		<StepRenderer
			step={steps[index]}
			stepList={steps}
			answers={answers}
			value={answers[steps[index]?.id]}
			error={null}
			onChange={() => {}}
			onSelect={() => {}}
			onAdvance={() => {}}
			onEdit={() => {}}
			onConfirm={() => {}}
			canSubmit={false}
			{...slotProps}
		/>
	);

	return (
		<section
			data-nexui="booking-form"
			className="flex min-h-[640px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
		>
			<ProgressBar current={currentIndex + 1} total={totalSteps} />

			<div className="flex items-center justify-between gap-4 px-6 pb-2">
				<h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
					{config.title}
				</h2>
				{currentIndex > 0 && (
					<Button
						variant="ghost"
						aria-label="Paso anterior"
						className="px-3 py-1.5 text-xs"
						onClick={handleBack}
					>
						← Atrás
					</Button>
				)}
			</div>

			{initialServiceLabel &&
				answers.service === prefilledService &&
				currentIndex === 0 && (
				<p className="px-6 pb-2 text-xs text-muted-foreground">
					Servicio preseleccionado desde la galería:{" "}
					<span className="font-medium text-foreground">
						{initialServiceLabel}
					</span>
					. Puedes cambiarlo si lo deseas.
				</p>
			)}

			<div ref={containerRef} className="relative flex-1 px-6 pb-8 pt-4">
				{prevStepIndex != null && (
					<div
						data-slot="prev"
						className="pointer-events-none absolute inset-x-6 bottom-8 top-4"
						aria-hidden="true"
						inert
					>
						{renderStep(prevStepIndex, { isPreview: true })}
					</div>
				)}

				<div
					data-slot="curr"
					key={currentIndex}
					className="flex min-h-[420px] items-start"
				>
					{renderStep(currentIndex, {
						value: answers[currentStep.id],
						error,
						onChange: handleChange,
						onSelect: (value) => handleChange(value, { advance: true }),
						onAdvance: () => handleAdvance(),
						onEdit: (stepId) => {
							const index = steps.findIndex((step) => step.id === stepId);
							if (index >= 0) goTo(index);
						},
						onConfirm: handleConfirm,
						canSubmit,
						isSubmitting,
						submitError,
					})}
				</div>
			</div>
		</section>
	);
}

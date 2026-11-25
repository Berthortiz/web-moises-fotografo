/**
 * SuccessScreen — pantalla final tras confirmar la solicitud.
 * Dibuja un check SVG con GSAP y anima los textos en stagger.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SuccessScreen({ config, whatsappUrl }) {
	const ref = useRef(null);

	useEffect(() => {
		const root = ref.current;
		if (!root) return;

		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		const ctx = gsap.context(() => {
			root.querySelectorAll("[data-success-check] path").forEach((path) => {
				const length = path.getTotalLength();
				gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
				gsap.to(path, {
					strokeDashoffset: 0,
					duration: 0.6,
					ease: "power2.inOut",
					delay: 0.15,
				});
			});

			const texts = root.querySelectorAll("[data-success-text]");
			if (texts.length) {
				gsap.fromTo(
					texts,
					{ y: 18, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						stagger: 0.12,
						duration: 0.4,
						ease: "power2.out",
						delay: 0.3,
					},
				);
			}
		}, root);

		return () => ctx.revert();
	}, []);

	return (
		<section
			ref={ref}
			aria-live="polite"
			className="flex min-h-[520px] w-full max-w-md flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-card px-8 py-12 text-center text-card-foreground shadow-2xl"
		>
			<svg
				data-success-check
				width="88"
				height="88"
				viewBox="0 0 88 88"
				fill="none"
				aria-hidden="true"
			>
				<circle
					cx="44"
					cy="44"
					r="40"
					stroke="var(--color-ring)"
					strokeWidth="4"
					className="opacity-40"
				/>
				<path
					d="M27 45 L39 57 L61 33"
					stroke="var(--color-success)"
					strokeWidth="6"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>

			<h2 data-success-text className="text-2xl font-bold">
				{config.successTitle || "¡Solicitud enviada!"}
			</h2>
			<p data-success-text className="text-sm text-muted-foreground">
				{config.successMessage ||
					"Gracias por escribirme. Te contactaré pronto para confirmar los detalles de tu sesión."}
			</p>

			{whatsappUrl && (
				<a
					data-success-text
					href={whatsappUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center justify-center rounded-[var(--radius)] border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
				>
					Reabrir WhatsApp
				</a>
			)}

			<a
				data-success-text
				href="/"
				className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
			>
				Volver al inicio
			</a>
		</section>
	);
}

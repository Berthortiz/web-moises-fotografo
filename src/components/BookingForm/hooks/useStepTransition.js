/**
 * useStepTransition — animación de cambio de pasos con GSAP.
 *
 * El contenedor mantiene dos slots durante la transición:
 *   - `data-slot="prev"`: paso saliente.
 *   - `data-slot="curr"`: paso entrante.
 *
 * El timeline desliza/fadea ambos en direcciones opuestas y hace stagger
 * de los elementos `[data-stagger]` del paso entrante. Al terminar llama
 * a `onComplete` para que el contenedor desmonte el paso saliente.
 */
import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * @param {number} currentIndex — índice del paso activo.
 * @param {boolean} hasPrev — true mientras exista un paso saliente en pantalla.
 * @param {number} direction — +1 avanzando, -1 retrocediendo.
 * @param {() => void} onComplete — se dispara al terminar la transición.
 */
export function useStepTransition(
	currentIndex,
	hasPrev,
	direction,
	onComplete,
) {
	const containerRef = useRef(null);
	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete;

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const q = gsap.utils.selector(container);
		const prevEl = q('[data-slot="prev"]');
		const currEl = q('[data-slot="curr"]');
		if (!currEl.length) return;

		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		if (reduced) {
			gsap.set(currEl, { clearProps: "all" });
			onCompleteRef.current?.();
			return;
		}

		const tl = gsap.timeline({
			defaults: { duration: 0.35, ease: "power2.out" },
			onComplete: () => onCompleteRef.current?.(),
		});

		if (hasPrev && prevEl.length) {
			tl.to(prevEl, {
				yPercent: 0,
				y: direction >= 0 ? -56 : 56,
				opacity: 0,
				pointerEvents: "none",
				duration: 0.3,
			}).fromTo(
				currEl,
				{ y: direction >= 0 ? 56 : -56, opacity: 0 },
				{ y: 0, opacity: 1 },
				"<",
			);
		} else {
			tl.fromTo(currEl, { y: 24, opacity: 0 }, { y: 0, opacity: 1 }, 0);
		}

		const staggerItems = currEl[0].querySelectorAll("[data-stagger]");
		if (staggerItems.length) {
			tl.fromTo(
				staggerItems,
				{ y: 14, opacity: 0 },
				{
					y: 0,
					opacity: 1,
					stagger: 0.08,
					duration: 0.3,
					ease: "power2.out",
				},
				"-=0.2",
			);
		}

		return () => {
			tl.revert();
		};
		// Solo debe re-ejecutarse al cambiar de paso.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentIndex]);

	return containerRef;
}

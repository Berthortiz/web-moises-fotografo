/**
 * PanoramaEffect — módulo custom para Swiper (efecto "panorama" 3D).
 *
 * Coloca los slides sobre un cilindro virtual alrededor del espectador:
 *   x        = R · sin(k·θ)          (arco horizontal)
 *   z        = R · (cos(k·θ) − 1)    (profundidad hacia atrás)
 *   rotateY  = k · θ                 (orientación de cada cara)
 *
 * donde k es el progreso de cada slide (0 = activa) y θ el ángulo por slide.
 * El radio R se deduce para que slides adyacentes queden pegadas:
 *   R = (anchoSlide + spaceBetween) / (2 · sin(θ/2))
 *
 * Basado en la estructura de `effect-creative.mjs` de Swiper (MIT).
 */

interface SwiperLike {
	params: Record<string, any>;
	slides: HTMLElement[];
	slidesSizesGrid: number[];
	wrapperEl: HTMLElement;
	classNames: string[];
}

interface ModuleArgs {
	swiper: SwiperLike;
	extendParams: (params: Record<string, any>) => void;
	on: (event: string, handler: (...args: any[]) => void) => void;
}

const DEG = Math.PI / 180;

export default function PanoramaEffect({ swiper, extendParams, on }: ModuleArgs) {
	extendParams({
		panoramaEffect: {
			// Grados de rotación entre slide y slide (curvatura del panorama)
			rotate: 22,
			// Progreso máximo (distancia en nº de slides) que participa en la curva
			limitProgress: 3,
			// Umbral mínimo de opacidad para slides al fondo de la curva
			minOpacity: 0,
		},
	});

	const clamp = (v: number, min: number, max: number) =>
		Math.min(Math.max(v, min), max);

	const setTranslate = () => {
		const { slides, slidesSizesGrid, params, wrapperEl } = swiper;
		const opts = params.panoramaEffect;
		const spaceBetween =
			typeof params.spaceBetween === "number" ? params.spaceBetween : 0;

		// Con centeredSlides el wrapper se fija para que la slide activa
		// quede centrada (misma técnica que EffectCreative).
		if (params.centeredSlides && slides.length) {
			const size0 = slidesSizesGrid[0] ?? 0;
			const margin = size0 / 2 - (params.slidesOffsetBefore ?? 0);
			wrapperEl.style.transform = `translateX(calc(50% - ${margin}px))`;
		}

		const stepRad = opts.rotate * DEG;
		const stepSin = Math.sin(stepRad / 2);

		for (let i = 0; i < slides.length; i += 1) {
			const slideEl = slides[i];
			const size = slidesSizesGrid[i] ?? slideEl.offsetWidth ?? 0;
			const offset = slideEl.swiperSlideOffset ?? 0;

			const raw = slideEl.progress ?? 0;
			const progress = clamp(raw, -opts.limitProgress, opts.limitProgress);

			// Radio del cilindro a partir del tamaño real de la slide
			const radius =
				size > 0 && stepSin > 0 ? (size + spaceBetween) / (2 * stepSin) : 0;

			const angle = progress * opts.rotate; // grados
			const rad = Math.abs(angle) * DEG;
			// Signo: slides a la izquierda (progress > 0) van a x negativo
			const x = -Math.sign(progress || 1) * Math.sin(rad) * radius;
			const z = (Math.cos(rad) - 1) * radius;

			// Posición base: cancela el offset natural del layout (virtualTranslate)
			// y coloca el centro de la slide en el punto del arco.
			slideEl.style.transform = `translate3d(${-offset + x}px, 0px, ${z}px) rotateY(${angle}deg)`;

			// Desvanecido continuo hacia el fondo de la curva
			const opacity = clamp(
				1 - Math.abs(raw) / (opts.limitProgress + 0.5),
				opts.minOpacity,
				1,
			);
			slideEl.style.opacity = String(opacity);
			slideEl.style.zIndex = String(
				slides.length - Math.round(Math.abs(raw)),
			);
		}
	};

	const setTransition = (duration: number) => {
		swiper.slides.forEach((el) => {
			el.style.transitionDuration = `${duration}ms`;
		});
	};

	on("beforeInit", () => {
		if (swiper.params.effect !== "panorama") return;
		// Igual que los efectos nativos: progreso por slide y wrapper sin mover.
		Object.assign(swiper.params, {
			watchSlidesProgress: true,
			virtualTranslate: true,
		});
	});

	on("setTranslate _virtualUpdated", () => {
		if (swiper.params.effect !== "panorama") return;
		setTranslate();
	});

	on("setTransition", (_swiper: SwiperLike, duration: number) => {
		if (swiper.params.effect !== "panorama") return;
		setTransition(duration);
	});
}

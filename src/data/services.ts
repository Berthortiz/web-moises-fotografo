/**
 * Servicios reservables del sitio.
 *
 * `id` es el valor canónico que viaja por la URL (`/reservas/?service=bodas`)
 * y el que usa el formulario. `gallerySlug` conecta con las páginas de
 * galería generadas en `src/pages/galeria/[category].astro`.
 */
export const BOOKING_SERVICES = [
	{ id: "bodas", label: "Bodas", gallerySlug: "bodas" },
	{ id: "real-estate", label: "Real Estate", gallerySlug: "real-estate" },
	{
		id: "eventos-conciertos",
		label: "Eventos y Conciertos",
		gallerySlug: "eventos",
	},
	{ id: "photoshoot", label: "Photoshoot", gallerySlug: "photoshoot" },
] as const;

export type BookingService = (typeof BOOKING_SERVICES)[number];
export type BookingServiceId = BookingService["id"];

export const BOOKING_SERVICE_IDS = BOOKING_SERVICES.map(
	(service) => service.id,
) as BookingServiceId[];

export function isBookingServiceId(
	value: string | null | undefined,
): value is BookingServiceId {
	return Boolean(value && BOOKING_SERVICE_IDS.includes(value as BookingServiceId));
}

export function bookingServiceByGallerySlug(
	slug: string,
): BookingService | undefined {
	return BOOKING_SERVICES.find((service) => service.gallerySlug === slug);
}

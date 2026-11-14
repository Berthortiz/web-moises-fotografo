/**
 * Enlaces de WhatsApp con mensaje prellenado.
 *
 * El número es el mismo de la web (`tel:+14075906377`). Se usa `wa.me`
 * en vez del `wa.link` acortado porque `wa.me` permite personalizar el
 * texto del mensaje dinámicamente por servicio.
 */
const WHATSAPP_NUMBER = "14075906377";

export function whatsappLink(servicio: string): string {
	const texto = `Me interesa contratar tus servicios de: ${servicio}`;
	return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

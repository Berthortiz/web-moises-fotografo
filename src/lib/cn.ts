/**
 * cn — helper de clases (clsx + tailwind-merge).
 * Une clases condicionales y resuelve conflictos entre utilidades
 * de Tailwind dejando ganar la última.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e6dcfb'/%3E%3Ccircle cx='200' cy='130' r='46' fill='%23cdbaf7'/%3E%3Ccircle cx='170' cy='96' r='16' fill='%23cdbaf7'/%3E%3Ccircle cx='230' cy='96' r='16' fill='%23cdbaf7'/%3E%3Ctext x='50%25' y='230' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%238a6384'%3ESin foto%3C/text%3E%3C/svg%3E";

/**
 * Sustituye una imagen rota por la imagen de reemplazo.
 *
 * @param event - Evento `error` de la etiqueta `img`.
 */
export function handleImageError(event: Event): void {
  (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
}

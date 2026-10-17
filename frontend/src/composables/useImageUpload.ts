import { computed, ref } from "vue";
import { uploadArticleImageUseCase } from "../core/usecases/uploadArticleImage.js";

/**
 * Maneja la foto de un formulario: guarda el archivo elegido con su vista previa y lo sube solo cuando se
 * envía el formulario.
 *
 * @param currentUrl - Devuelve la URL de la foto que ya tiene el registro (vacía si no tiene).
 * @returns `pendingPreview` y `isUploading` para la plantilla, `hasImage` (hay foto actual o elegida),
 * `select` para el evento `selected` del selector de imagen, `resolveUrl` para obtener la URL final
 * subiendo el archivo pendiente, y `reset` para descartar el archivo elegido.
 */
export function useImageUpload(currentUrl: () => string) {
  const pendingFile = ref<File | null>(null);
  const pendingPreview = ref("");
  const isUploading = ref(false);

  const hasImage = computed(() => Boolean(currentUrl()) || pendingFile.value !== null);

  function select(file: File, previewUrl = ""): void {
    pendingFile.value = file;
    pendingPreview.value = previewUrl;
  }

  function reset(): void {
    pendingFile.value = null;
    pendingPreview.value = "";
  }

  /**
   * Devuelve la URL que debe guardarse: la actual si no se eligió otra foto, o la de la foto recién subida.
   *
   * @returns La URL de la imagen.
   * @throws Error si la subida falla.
   */
  async function resolveUrl(): Promise<string> {
    if (!pendingFile.value) return currentUrl();
    isUploading.value = true;
    try {
      const uploaded = await uploadArticleImageUseCase.execute(pendingFile.value);
      return uploaded.url;
    } finally {
      isUploading.value = false;
    }
  }

  return { pendingPreview, isUploading, hasImage, select, reset, resolveUrl };
}

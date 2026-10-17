import { ref, watch } from "vue";
import { validateImageFile } from "../validators/imageValidators.js";

/**
 * Selector de foto: valida el archivo elegido, genera su vista previa y avisa al formulario.
 *
 * @param initialUrl - Devuelve la URL de la foto que ya tiene el registro, si la tiene.
 * @param onSelected - Se llama con el archivo válido y su vista previa en formato data URL.
 * @returns `previewUrl` y `errorMessage` para la plantilla, y `handleFileChange` para el evento `change` del campo.
 */
export function useImagePreview(initialUrl: () => string | undefined, onSelected: (file: File, previewUrl: string) => void) {
  const previewUrl = ref(initialUrl() ?? "");
  const errorMessage = ref("");

  watch(initialUrl, (value) => {
    if (value && !previewUrl.value.startsWith("data:")) previewUrl.value = value;
  });

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer la foto."));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    errorMessage.value = "";
    const problem = await validateImageFile(file);
    if (problem) {
      errorMessage.value = problem;
      input.value = "";
      return;
    }

    try {
      previewUrl.value = await readAsDataUrl(file);
      onSelected(file, previewUrl.value);
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : "No se pudo leer la foto.";
    }
  }

  return { previewUrl, errorMessage, handleFileChange };
}

<script setup lang="ts">
import { ref } from "vue";
import { excelDownloadAdapter } from "../../services/http/ExcelDownloadAdapter.js";

const isDownloading = ref(false);
const errorMessage = ref("");

async function handleExport(): Promise<void> {
  errorMessage.value = "";
  isDownloading.value = true;
  try {
    await excelDownloadAdapter.download("/reports/inventory", "inventario-reporte.xlsx");
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "No se pudo descargar el reporte.";
  } finally {
    isDownloading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-end gap-1">
    <button
      class="cartoon-btn-secondary"
      :disabled="isDownloading"
      @click="handleExport"
    >
      <font-awesome-icon v-if="!isDownloading" icon="chart-bar" class="mr-1" />
      {{ isDownloading ? "Generando..." : "Exportar a Excel" }}
    </button>
    <p v-if="errorMessage" class="text-sm font-semibold text-rose-600">{{ errorMessage }}</p>
  </div>
</template>

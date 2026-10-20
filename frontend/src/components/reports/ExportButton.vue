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
      type="button"
      class="ui-btn ui-btn-ghost"
      :disabled="isDownloading"
      aria-label="Llevarme todo en Excel"
      title="Llevarme todo en Excel"
      @click="handleExport"
    >
      <font-awesome-icon icon="chart-bar" :class="{ 'animate-pulse': isDownloading }" />
      <span class="hidden md:inline">{{ isDownloading ? "Armando el Excel..." : "Llevarme todo en Excel" }}</span>
    </button>
    <p v-if="errorMessage" role="alert" class="ui-error max-w-[14rem]">{{ errorMessage }}</p>
  </div>
</template>

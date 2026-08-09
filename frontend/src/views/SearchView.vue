<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { searchArticles, type SearchResult } from "../infrastructure/httpSearchRepository.js";

const router = useRouter();

const query = ref("");
const results = ref<SearchResult[]>([]);
const isLoading = ref(false);
const searched = ref(false);

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%2394a3b8'%3ESin imagen%3C/text%3E%3C/svg%3E";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (!val.trim()) {
    results.value = [];
    searched.value = false;
    return;
  }
  debounceTimer = setTimeout(() => runSearch(val), 300);
});

async function runSearch(q: string): Promise<void> {
  isLoading.value = true;
  searched.value = true;
  try {
    results.value = await searchArticles(q);
  } finally {
    isLoading.value = false;
  }
}

function handleImageError(event: Event): void {
  (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
}

function goToArticle(id: number): void {
  router.push(`/articles/${id}`);
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 text-center">
      <div class="cartoon-panel inline-block px-5 py-2 mb-3">
        <font-awesome-icon icon="magnifying-glass" class="mr-2 text-sky-500" />
        <span class="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Búsqueda Inteligente</span>
      </div>
      <h1 class="text-3xl font-extrabold text-slate-900">¿Qué estás buscando?</h1>
      <p class="mt-2 text-slate-600">Busca por nombre o descripción. Encuentra cualquier artículo al instante.</p>
    </div>

    <!-- Search input -->
    <div class="relative mb-8">
      <div class="cartoon-panel flex items-center gap-3 px-4 py-3">
        <font-awesome-icon
          icon="magnifying-glass"
          class="text-xl text-slate-400 shrink-0"
          :class="{ 'animate-pulse text-sky-500': isLoading }"
        />
        <input
          v-model="query"
          type="text"
          placeholder="Ej: lámpara, silla rota, cable HDMI..."
          class="flex-1 bg-transparent text-lg font-semibold text-slate-900 placeholder-slate-400 outline-none"
          autofocus
        />
        <button
          v-if="query"
          class="shrink-0 rounded-full border-2 border-slate-900 bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-gray-100 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          @click="query = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="cartoon-panel px-6 py-4 text-center">
        <font-awesome-icon icon="magnifying-glass" class="mb-2 text-3xl text-sky-500 animate-bounce" />
        <p class="font-bold text-slate-700">Buscando...</p>
      </div>
    </div>

    <!-- Empty state initial -->
    <div v-else-if="!searched" class="py-12 text-center">
      <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-900 bg-sky-100 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        <font-awesome-icon icon="magnifying-glass" class="text-4xl text-sky-500" />
      </div>
      <p class="text-lg font-bold text-slate-700">Escribe algo para comenzar</p>
      <p class="text-sm text-slate-500">La búsqueda es difusa — encuentra aunque haya errores de tipeo.</p>
    </div>

    <!-- No results -->
    <div v-else-if="results.length === 0" class="py-12 text-center">
      <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-900 bg-orange-100 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        <font-awesome-icon icon="box-open" class="text-4xl text-orange-500" />
      </div>
      <p class="text-lg font-bold text-slate-700">Sin resultados para "{{ query }}"</p>
      <p class="text-sm text-slate-500 mt-1">Prueba con otro término o revisa la ortografía.</p>
    </div>

    <!-- Results -->
    <div v-else>
      <p class="mb-4 text-sm font-bold text-slate-500">
        {{ results.length }} resultado{{ results.length !== 1 ? 's' : '' }} para
        <span class="text-slate-800">"{{ query }}"</span>
      </p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <button
          v-for="item in results"
          :key="item.id"
          class="cartoon-card overflow-hidden text-left transition-transform hover:-translate-y-1 focus:outline-none"
          @click="goToArticle(item.id)"
        >
          <img
            :src="item.imageUrl || FALLBACK_IMAGE"
            :alt="item.name"
            class="h-40 w-full border-b-4 border-slate-900 object-cover"
            @error="handleImageError"
          />
          <div class="flex flex-col gap-2 p-4">
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-base font-extrabold text-slate-900 leading-tight">{{ item.name }}</h3>
              <span
                class="shrink-0 rounded-full border-2 border-black px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                :class="item.stock === 0 ? 'bg-red-200 text-red-900' : 'bg-lime-200 text-lime-900'"
              >
                {{ item.stock }}
              </span>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2">{{ item.description || "Sin descripción" }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="rounded-full border-2 border-slate-300 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                <font-awesome-icon icon="folder" class="mr-1 text-sky-400" />{{ item.categoryName }}
              </span>
              <span
                v-if="item.needsRepair"
                class="rounded-full border-2 border-black bg-orange-200 px-2 py-0.5 text-xs font-bold text-orange-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <font-awesome-icon icon="wrench" class="mr-1" />Reparación
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

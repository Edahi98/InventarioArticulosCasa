<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { searchArticles, type SearchResult } from "../infrastructure/httpSearchRepository.js";
import { searchForm } from "../validators/searchValidators.js";
import { validateInput } from "../validators/validateInput.js";
import { listPeekBears } from "../core/usecases/listHomeBears.js";
import type { LoginMood } from "../infrastructure/three/LoginStage.js";
import ArticleRow from "../components/articles/ArticleRow.vue";
import BearPeekScene from "../components/BearPeekScene.vue";
import MenuBackdrop from "../components/ui/MenuBackdrop.vue";

const router = useRouter();
const bears = listPeekBears();

const query = ref("");
const results = ref<SearchResult[]>([]);
const isLoading = ref(false);
const searched = ref(false);
const queryError = ref("");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const gazeX = computed(() => Math.min(query.value.length / 16, 1) * 1.6 - 0.8);
const mood = computed<LoginMood>(() => {
  if (isLoading.value) return "happy";
  if (searched.value && results.value.length === 0) return "sad";
  return "idle";
});

watch(query, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  queryError.value = "";
  if (!val.trim()) {
    results.value = [];
    searched.value = false;
    return;
  }

  const checked = validateInput(searchForm, { q: val });
  if (!checked.ok) {
    queryError.value = `La búsqueda ${checked.failure.fields.q ?? "no es válida"}.`;
    results.value = [];
    searched.value = false;
    return;
  }
  debounceTimer = setTimeout(() => runSearch(checked.data.q), 300);
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

function goToArticle(id: number): void {
  router.push(`/articles/${id}`);
}
</script>

<template>
  <section class="isolate mx-auto max-w-5xl px-4 py-10 md:px-8">
    <MenuBackdrop scene="busqueda" class="pointer-events-none fixed inset-0 -z-10" />
    <div class="mx-auto max-w-2xl">
      <div class="-mb-[72px] h-[230px] w-full">
        <BearPeekScene :bears="bears" :gaze-x="gazeX" :covering="false" :mood="mood" />
      </div>

      <div class="menu-panel">
        <header class="menu-title">
          <h1 class="ui-sign text-4xl leading-none md:text-5xl">¿Qué se perdió?</h1>
        </header>
        <p class="menu-label text-center">Misión: encontrar una cosa</p>
        <p class="mt-2 text-center font-semibold text-[var(--l-muted)]">
          Escribe un pedazo del nombre. Los guardianes lo buscan, aunque lo escribas mal.
        </p>

        <div class="relative mt-5">
          <label for="search" class="sr-only">Buscar un artículo</label>
          <input
            id="search"
            v-model="query"
            type="text"
            placeholder="lámpara, cable, la olla grande..."
            class="ui-input !py-4 !pr-12 text-lg"
            autocomplete="off"
            autofocus
          />
          <button
            v-if="query"
            type="button"
            class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--l-surface-2)] font-semibold"
            aria-label="Borrar la búsqueda"
            @click="query = ''"
          >
            &times;
          </button>
        </div>
      </div>
    </div>

    <div class="menu-panel mt-12 !pt-6">
      <p v-if="queryError" role="alert" class="ui-error text-center">{{ queryError }}</p>

      <p v-else-if="isLoading" class="text-center text-[var(--l-muted)]">Los guardianes están revisando los cuartos...</p>

      <p v-else-if="!searched" class="text-center text-[var(--l-muted)]">
        Empieza a escribir y aparecerán por aquí.
      </p>

      <div v-else-if="results.length === 0" class="text-center">
        <p class="text-xl font-semibold">Nadie encontró "{{ query }}"</p>
        <p class="mt-1 text-[var(--l-muted)]">Prueba con otra palabra, o puede que aún no esté guardado.</p>
        <router-link to="/articles/new" class="ui-btn ui-btn-primary mt-6">Guardarlo ahora</router-link>
      </div>

      <div v-else>
        <p class="menu-slot mb-6 inline-flex !py-1.5 text-sm font-extrabold">
          <span class="menu-badge menu-badge-sun !h-8 !w-8">{{ results.length }}</span>
          {{ results.length === 1 ? "cosa encontrada" : "cosas encontradas" }}
        </p>
        <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="item in results" :key="item.id" class="flex flex-col gap-3">
            <button
              type="button"
              class="block rounded-[var(--l-radius)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--l-accent)]"
              @click="goToArticle(item.id)"
            >
              <ArticleRow :article="item" />
            </button>
            <p class="text-sm text-[var(--l-muted)]">
              Vive en <span class="font-semibold text-[var(--l-ink)]">{{ item.categoryName }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

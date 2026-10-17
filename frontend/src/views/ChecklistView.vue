<script setup lang="ts">
import { computed, ref } from "vue";
import { listPeekBears } from "../core/usecases/listHomeBears.js";
import { BULLET_PATTERN, FALLBACK_NOTE, PLAN_IDEAS, SOURCE_LABELS } from "../constantes/checklist_constantes.js";
import type { LoginMood } from "../infrastructure/three/LoginStage.js";
import { useChecklist } from "../composables/useChecklist.js";
import { useFormSubmit } from "../composables/useFormSubmit.js";
import { useRecipeImport } from "../composables/useRecipeImport.js";
import BearPeekScene from "../components/BearPeekScene.vue";
import ChecklistBackpack from "../components/checklist/ChecklistBackpack.vue";
import ChecklistClothesline from "../components/checklist/ChecklistClothesline.vue";
import ChecklistCorkboard from "../components/checklist/ChecklistCorkboard.vue";
import ChecklistShelf from "../components/checklist/ChecklistShelf.vue";
import ChecklistTag from "../components/checklist/ChecklistTag.vue";
import MenuBackdrop from "../components/ui/MenuBackdrop.vue";

const bears = listPeekBears();
const feedback = useFormSubmit();
const { errorMessage } = feedback;

const mode = ref<"escribir" | "pagina">("escribir");
const title = ref("");
const text = ref("");
const lines = computed(() => text.value.split("\n").map((line) => line.trim().replace(BULLET_PATTERN, "")).filter(Boolean));

const { pageUrl, pageLists, pickedList, isFetching, usedFallback, fetchPage, pickList } = useRecipeImport({ feedback, title, text });
const {
  hasReviewed,
  isReviewing,
  copied,
  celebrations,
  results,
  selected,
  summary,
  statuses,
  have,
  toCheck,
  missing,
  selectedEntry,
  review,
  choose,
  toggleSelect,
  copyPending,
} = useChecklist({ feedback, title, lines });

const gazeX = computed(() => Math.min(text.value.length / 160, 1) * 1.6 - 0.8);
const mood = computed<LoginMood>(() => {
  if (isReviewing.value || isFetching.value) return "happy";
  if (!hasReviewed.value) return "idle";
  if (summary.value.complete) return "happy";
  return summary.value.falta + summary.value.revisar > summary.value.tengo ? "sad" : "idle";
});

function applyIdea(idea: (typeof PLAN_IDEAS)[number]): void {
  mode.value = "escribir";
  title.value = idea.title;
  text.value = idea.items.join("\n");
}
</script>

<template>
  <section class="isolate mx-auto max-w-[100rem] px-4 py-10 md:px-8">
    <MenuBackdrop scene="lista" :celebrate="celebrations" class="pointer-events-none fixed inset-0 -z-10" />

    <div class="mx-auto max-w-2xl">
      <div class="-mb-[72px] h-[230px] w-full">
        <BearPeekScene :bears="bears" :gaze-x="gazeX" :covering="false" :mood="mood" />
      </div>

      <form class="menu-panel" @submit.prevent="review">
        <header class="menu-title">
          <h1 class="ui-sign text-4xl leading-none md:text-5xl">¿Tengo todo?</h1>
        </header>
        <p class="menu-label text-center">Misión: armar la mochila</p>
        <p class="mt-2 text-center font-semibold text-[var(--l-muted)]">
          Cuéntales para qué es, una receta, un paseo o una fiesta, y los guardianes revisan si en la casa está todo lo que hace falta.
        </p>

        <div class="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Ideas para empezar">
          <button v-for="idea in PLAN_IDEAS" :key="idea.label" type="button" class="ui-chip ui-chip-sun" @click="applyIdea(idea)">
            {{ idea.label }}
          </button>
        </div>

        <div class="mt-6">
          <label for="plan-title" class="ui-label">¿Para qué es?</label>
          <input id="plan-title" v-model="title" type="text" class="ui-input mt-1" placeholder="Panqué de elote, día de campo..." autocomplete="off" />
        </div>

        <div class="mt-5 flex justify-center gap-2" role="tablist" aria-label="Cómo armar la lista">
          <button type="button" role="tab" :aria-selected="mode === 'escribir'" class="ui-btn ui-btn-sm" :class="mode === 'escribir' ? 'ui-btn-primary' : 'ui-btn-ghost'" @click="mode = 'escribir'">
            <font-awesome-icon icon="pen" /> Escribirla
          </button>
          <button type="button" role="tab" :aria-selected="mode === 'pagina'" class="ui-btn ui-btn-sm" :class="mode === 'pagina' ? 'ui-btn-primary' : 'ui-btn-ghost'" @click="mode = 'pagina'">
            <font-awesome-icon icon="map" /> Traerla de una página
          </button>
        </div>

        <div v-if="mode === 'pagina'" class="mt-5">
          <label for="page-url" class="ui-label">Dirección de la receta o la guía</label>
          <div class="mt-1 flex flex-col gap-3 sm:flex-row">
            <input id="page-url" v-model="pageUrl" type="url" class="ui-input" placeholder="https://..." autocomplete="off" @keydown.enter.prevent="fetchPage" />
            <button type="button" class="ui-btn ui-btn-primary" :disabled="isFetching || !pageUrl.trim()" @click="fetchPage">
              {{ isFetching ? "Leyendo..." : "Traer la lista" }}
            </button>
          </div>
          <p v-if="isFetching" class="mt-3 text-center text-[var(--l-muted)]">Los guardianes están leyendo la página...</p>

          <div v-if="pageLists.length" class="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Listas encontradas en la página">
            <p class="menu-label">Encontraron {{ pageLists.length === 1 ? "esto" : "estas opciones" }}, elige la tuya</p>
            <p v-if="usedFallback" class="text-sm font-semibold text-[var(--l-muted)]">{{ FALLBACK_NOTE }}</p>
            <button
              v-for="(list, index) in pageLists"
              :key="index"
              type="button"
              role="radio"
              :aria-checked="pickedList === index"
              class="menu-slot text-left"
              :class="{ 'is-picked': pickedList === index }"
              @click="pickList(index)"
            >
              <span class="menu-badge" :class="pickedList === index ? 'menu-badge-sun' : 'menu-badge-lilac'">{{ list.items.length }}</span>
              <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ list.items.slice(0, 3).join(" · ") }}</span>
              <span class="ui-chip ui-chip-lilac shrink-0">{{ SOURCE_LABELS[list.source] }}</span>
              <font-awesome-icon v-if="pickedList === index" icon="check" />
            </button>
          </div>
        </div>

        <div class="mt-5">
          <label for="plan-lines" class="ui-label">Lo que hace falta <span class="font-semibold text-[var(--l-muted)]">(una cosa por renglón)</span></label>
          <textarea
            id="plan-lines"
            v-model="text"
            rows="7"
            class="ui-input mt-1"
            placeholder="2 tazas de harina&#10;4 huevos&#10;Molde para panqué&#10;..."
          />
          <p class="mt-1 text-right text-xs font-bold text-[var(--l-muted)]">{{ lines.length }} {{ lines.length === 1 ? "cosa" : "cosas" }}</p>
        </div>

        <p v-if="errorMessage" role="alert" class="ui-error mt-3 text-center">{{ errorMessage }}</p>

        <button type="submit" class="ui-btn ui-btn-primary mt-5 w-full" :disabled="isReviewing || lines.length === 0">
          <font-awesome-icon icon="list-check" />
          {{ isReviewing ? "Revisando los cuartos..." : "Revisar la casa" }}
        </button>
      </form>
    </div>

    <div
      v-if="hasReviewed"
      ref="results"
      class="mx-auto mt-12 grid max-w-[100rem] scroll-mt-24 items-start gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[23rem_minmax(0,1fr)]"
    >
      <aside class="flex flex-col gap-4 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pb-3 lg:[scrollbar-width:none]">
        <ChecklistBackpack :summary="summary" :statuses="statuses" :title="title.trim()" :compact="selectedEntry !== null" />

        <ChecklistTag v-if="selectedEntry" :key="selectedEntry.index" :entry="selectedEntry" @choose="choose(selectedEntry.index, $event)" @close="selected = null" />
        <p v-else class="rounded-[var(--l-radius)] bg-[var(--l-surface)] px-4 py-3 text-center text-sm font-semibold text-[var(--l-muted)] shadow-[0_5px_0_var(--l-toy-edge)]">
          Toca un objeto, una foto o una nota y se abre su etiqueta de maleta.
        </p>

        <div v-if="!summary.complete" class="flex flex-wrap justify-center gap-3">
          <button type="button" class="ui-btn ui-btn-primary" @click="copyPending">
            <font-awesome-icon :icon="copied ? 'check' : 'paper-plane'" />
            {{ copied ? "¡Lista copiada!" : "Copiar lo que falta" }}
          </button>
          <router-link to="/articles/new" class="ui-btn ui-btn-ghost"><font-awesome-icon icon="plus" /> Guardar algo nuevo</router-link>
        </div>
      </aside>

      <div class="grid min-w-0 items-start gap-8 xl:grid-cols-2">
        <ChecklistShelf v-if="have.length" class="xl:col-span-2" :entries="have" :selected="selected" @select="toggleSelect" />
        <ChecklistClothesline v-if="toCheck.length" :class="{ 'xl:col-span-2': !missing.length }" :entries="toCheck" :selected="selected" @select="toggleSelect" />
        <ChecklistCorkboard v-if="missing.length" :class="{ 'xl:col-span-2': !toCheck.length }" :entries="missing" :selected="selected" @select="toggleSelect" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.menu-slot.is-picked {
  border-color: var(--l-accent);
  background: var(--l-surface);
}
</style>

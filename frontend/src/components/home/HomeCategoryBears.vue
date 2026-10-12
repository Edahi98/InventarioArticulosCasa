<script setup lang="ts">
import { computed, ref } from "vue";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import HomeBearScene from "./HomeBearScene.vue";

const props = defineProps<{ bears: InventoryBear[] }>();

const activeId = ref<string>(props.bears[0]?.id ?? "");
const active = computed(() => props.bears.find((bear) => bear.id === activeId.value) ?? null);
</script>

<template>
  <section id="guardianes" class="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
    <h2 class="ui-sign mb-10 max-w-xl text-4xl text-[var(--l-ink)] md:text-5xl">
      Cada guardián conoce su cuarto
    </h2>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div class="ui-toy h-[320px] bg-[var(--l-surface)] sm:h-[400px] lg:col-span-7 lg:h-[500px]">
        <HomeBearScene :bears="bears" :active-id="activeId" label="Los cuatro guardianes de la casa, uno por cuarto" />
      </div>

      <div class="flex flex-col gap-5 lg:col-span-5">
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="bear in bears"
            :key="bear.id"
            type="button"
            :aria-pressed="bear.id === activeId"
            class="landing-choice"
            :class="{ 'landing-choice-active': bear.id === activeId }"
            @click="activeId = bear.id"
          >
            {{ bear.name }}
          </button>
        </div>

        <article v-if="active" class="ui-toy ui-stitch space-y-5 bg-[var(--l-surface)] p-8">
          <header>
            <h3 class="text-3xl text-[var(--l-ink)]">{{ active.name }}</h3>
            <p class="text-sm text-[var(--l-muted)]">Guardián de {{ active.room }}</p>
          </header>
          <p class="text-base leading-relaxed text-[var(--l-ink)]">{{ active.summary }}</p>
          <ul class="flex flex-wrap gap-2">
            <li
              v-for="item in active.items"
              :key="item"
              class="rounded-[var(--l-radius)] bg-[var(--l-bg)] px-3 py-1.5 text-sm text-[var(--l-muted)]"
            >
              {{ item }}
            </li>
          </ul>
          <p class="text-sm text-[var(--l-muted)]">
            <span class="font-semibold text-[var(--l-ink)]">Su manía:</span> {{ active.quirk }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

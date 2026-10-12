<script setup lang="ts">
import { computed } from "vue";
import type { Category } from "../core/domain/category.js";
import { FALLBACK_IMAGE, handleImageError } from "../utils/fallbackImage.js";
import { ROOM_FLOOR, roomTone } from "../utils/roomTone.js";

const props = defineProps<{
  category: Pick<Category, "id" | "name" | "description" | "imageUrl">;
}>();

const tone = computed(() => roomTone(props.category.id));
</script>

<template>
  <article
    class="ui-toy flex h-full flex-col overflow-hidden text-[var(--l-tag-ink)] transition-transform duration-200 hover:-translate-y-1 hover:rotate-[-0.6deg]"
    :style="{ background: tone.wall }"
  >
    <div class="ui-awning" :style="{ '--awning': tone.rug }" />
    <div class="p-3 pb-0 pt-6">
      <div class="aspect-[4/3] overflow-hidden rounded-xl border-[6px] border-[#fffaf2] bg-[#fffaf2]">
        <img
          :src="category.imageUrl || FALLBACK_IMAGE"
          :alt="category.name"
          class="h-full w-full object-cover"
          @error="handleImageError"
        />
      </div>
    </div>
    <div class="flex-1 space-y-1 px-5 pb-6 pt-4">
      <h3 class="text-lg font-semibold leading-snug tracking-tight">{{ category.name }}</h3>
      <p class="line-clamp-2 text-sm leading-relaxed opacity-80">
        {{ category.description || "Sin descripción" }}
      </p>
    </div>
    <div class="relative h-4" :style="{ background: ROOM_FLOOR }">
      <span
        class="absolute -top-1.5 left-1/2 h-3 w-2/5 -translate-x-1/2 rounded-full"
        :style="{ background: tone.rug }"
      />
    </div>
  </article>
</template>

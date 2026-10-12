<script setup lang="ts">
import { ref } from "vue";
import type { InventoryBear } from "../../core/domain/inventoryBear.js";
import type { LoginMood } from "../../infrastructure/three/LoginStage.js";
import BearPeekScene from "../BearPeekScene.vue";

defineProps<{ bears: InventoryBear[] }>();
defineEmits<{ enter: [] }>();

const gazeX = ref(0);
const mood = ref<LoginMood>("idle");

function followPointer(event: PointerEvent): void {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
  gazeX.value = ((event.clientX - box.left) / box.width) * 2 - 1;
}
</script>

<template>
  <section
    class="mx-auto max-w-5xl px-4 pb-24 pt-8 md:px-8 md:pb-32"
    @pointermove="followPointer"
    @pointerleave="gazeX = 0"
  >
    <div class="-mb-[72px] h-[230px] w-full">
      <BearPeekScene :bears="bears" :gaze-x="gazeX" :covering="false" :mood="mood" />
    </div>

    <div class="ui-toy ui-stitch relative bg-[var(--l-surface)] px-6 py-14 text-center md:px-16 md:py-20">
      <div class="mx-auto max-w-xl space-y-6">
        <h2 class="ui-sign text-5xl text-[var(--l-ink)] md:text-6xl">
          La casa está abierta
        </h2>
        <p class="mx-auto max-w-[46ch] text-base leading-relaxed text-[var(--l-muted)]">
          Empieza por un solo cuarto. Con la cocina o el taller basta para ver cómo funciona.
        </p>
        <button
          class="ui-btn ui-btn-primary"
          type="button"
          @click="$emit('enter')"
          @pointerenter="mood = 'happy'"
          @pointerleave="mood = 'idle'"
        >
          Entrar al inventario
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { listPeekBears } from "../core/usecases/listHomeBears.js";
import BearPeekScene from "../components/BearPeekScene.vue";

const router = useRouter();
const bears = listPeekBears();
</script>

<template>
  <section class="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl flex-col justify-center px-4 py-10">
    <div class="-mb-[72px] h-[230px] w-full">
      <BearPeekScene :bears="bears" :gaze-x="0" :covering="false" mood="sad" />
    </div>
    <div class="ui-toy ui-stitch relative bg-[var(--l-surface)] px-8 pb-10 pt-10 text-center">
      <h1 class="ui-sign text-4xl md:text-5xl">Esta puerta no existe</h1>
      <p class="mx-auto mt-3 max-w-[40ch] leading-relaxed text-[var(--l-muted)]">
        Ni los guardianes encontraron nada en esta dirección. Quizá se movió de cuarto.
      </p>
      <button type="button" class="ui-btn ui-btn-primary mt-7" @click="router.push('/')">Volver a la entrada</button>
    </div>
  </section>
</template>

<script setup lang="ts">
interface HangTag {
  guardian: string;
  question: string;
  answer: string;
  color: string;
  offset: string;
  tilt: string;
}

const TAGS: HangTag[] = [
  {
    guardian: "Tuerca",
    question: "¿Dónde quedó el taladro?",
    answer: "Escribe parte del nombre y te muestro el artículo, su foto y cuántos hay.",
    color: "#ffe98a",
    offset: "md:mt-0",
    tilt: "md:-rotate-2",
  },
  {
    guardian: "Caja",
    question: "Esta lámpara ya no prende.",
    answer: "Márcala para reparar y quita el aviso el día que la arregles.",
    color: "#ffb3cb",
    offset: "md:mt-12",
    tilt: "md:rotate-1",
  },
  {
    guardian: "Página",
    question: "¿A quién se lo presté?",
    answer: "Deja una nota en el artículo: la garantía, el color o quién se lo llevó.",
    color: "#cdbaf7",
    offset: "md:mt-5",
    tilt: "md:-rotate-1",
  },
];
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 pb-24 md:px-8 md:pb-32">
    <h2 class="ui-sign mb-14 max-w-xl text-4xl text-[var(--l-ink)] md:text-5xl">
      Cosas que les puedes pedir
    </h2>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
      <article
        v-for="tag in TAGS"
        :key="tag.guardian"
        class="hang-tag ui-toy relative px-6 pb-8 pt-12 text-[#2a2233]"
        :class="[tag.offset, tag.tilt]"
        :style="{ background: tag.color }"
      >
        <span class="hang-tag-hole" aria-hidden="true"></span>
        <p class="text-sm font-semibold opacity-70">{{ tag.guardian }}, ¿me ayudas?</p>
        <h3 class="mt-2 text-2xl leading-snug">{{ tag.question }}</h3>
        <p class="mt-4 text-sm leading-relaxed">{{ tag.answer }}</p>
      </article>
    </div>
  </section>
</template>

<style>
.hang-tag {
  border-radius: var(--l-radius);
}

.hang-tag-hole {
  position: absolute;
  top: 1rem;
  left: 50%;
  width: 1.1rem;
  height: 1.1rem;
  transform: translateX(-50%);
  border-radius: 9999px;
  background: var(--l-bg);
  box-shadow: inset 0 0 0 2px rgb(42 34 51 / 0.25);
}
</style>

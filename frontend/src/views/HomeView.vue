<script setup lang="ts">
import { useRouter } from "vue-router";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";
import HomeFeatureCard from "../components/home/HomeFeatureCard.vue";
import HomeBenefitItem from "../components/home/HomeBenefitItem.vue";

const router = useRouter();

function goToDashboard(): void {
  if (authenticatedHttpClient.isAuthenticated()) {
    router.push("/categories");
  } else {
    router.push({ path: "/login", query: { redirect: "/categories" } });
  }
}
</script>

<template>
  <!-- Hero Section -->
  <section class="px-6 py-16 md:px-16">
    <div class="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
      <!-- Copy -->
      <div class="space-y-6">
        <div class="cartoon-panel inline-block px-4 py-1">
          <span class="text-sm font-extrabold text-slate-900">
            <font-awesome-icon icon="box" class="mr-1" /> Inventario del Hogar
          </span>
        </div>
        <h1 class="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
          Toma el control<br />
          <span class="text-sky-500">de tu hogar</span>
        </h1>
        <p class="max-w-md text-lg text-slate-600">
          Gestiona tus artículos físicos con precisión. Un sistema diseñado para traer orden a tu espacio vital a través de una organización impecable.
        </p>
        <div class="flex flex-wrap gap-4 pt-2">
          <button class="cartoon-btn-primary px-8 py-3 text-base" @click="goToDashboard">
            <font-awesome-icon icon="folder-open" class="mr-2" />
            Ir al Dashboard
          </button>
          <a href="#features" class="cartoon-btn-secondary px-8 py-3 text-base">
            Explorar Funciones
          </a>
        </div>
      </div>

      <!-- Hero image -->
      <div class="relative">
        <div class="cartoon-card overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop"
            alt="Hogar organizado"
            class="h-72 w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
        <div class="absolute -bottom-3 -right-3 h-24 w-24 rounded-full bg-yellow-200 border-4 border-slate-900 -z-10"></div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="bg-white/60 px-6 py-16 md:px-16">
    <div class="mx-auto max-w-6xl">
      <div class="mb-10 text-center">
        <span class="text-sm font-extrabold uppercase tracking-widest text-sky-500">Características</span>
        <h2 class="mt-1 text-3xl font-extrabold text-slate-900">Diseñado para la eficiencia</h2>
      </div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <HomeFeatureCard
          icon="box-open"
          title="Inventario Maestro"
          description="Cataloga cada rincón de tu casa con categorías personalizadas y búsqueda instantánea."
          icon-bg="bg-sky-200"
        />
        <HomeFeatureCard
          icon="magnifying-glass"
          title="Búsqueda Rápida"
          description="Encuentra cualquier artículo al instante sin tener que abrir cajones ni cajas."
          icon-bg="bg-lime-200"
        />
        <HomeFeatureCard
          icon="wrench"
          title="Alertas de Reparación"
          description="Marca artículos que necesitan reparación y mantén el estado de tus pertenencias actualizado."
          icon-bg="bg-orange-200"
        />
      </div>
    </div>
  </section>

  <!-- Detail Section -->
  <section class="px-6 py-16 md:px-16">
    <div class="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row">
      <!-- Image -->
      <div class="flex-1">
        <div class="aspect-square overflow-hidden rounded-full border-8 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <img
            src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&auto=format&fit=crop"
            alt="Hogar ordenado"
            class="h-full w-full object-cover"
          />
        </div>
      </div>
      <!-- Copy -->
      <div class="flex-1 space-y-6">
        <h2 class="text-3xl font-extrabold text-slate-900 md:text-4xl">
          La paz mental comienza con el orden
        </h2>
        <p class="text-lg text-slate-600">
          No se trata solo de saber dónde están las cosas, sino de liberar espacio mental para lo que realmente importa. Transforma el caos doméstico en un sistema fluido y predecible.
        </p>
        <ul class="space-y-3">
          <HomeBenefitItem text="Reducción del estrés diario" />
          <HomeBenefitItem text="Ahorro en compras duplicadas" />
          <HomeBenefitItem text="Optimización real del espacio" />
        </ul>
        <button class="cartoon-btn-primary mt-2 px-8 py-3 text-base" @click="goToDashboard">
          Empezar ahora
        </button>
      </div>
    </div>
  </section>

  <!-- Testimonial Section -->
  <section class="bg-pink-100 px-6 py-16 md:px-16">
    <div class="cartoon-panel mx-auto max-w-2xl p-10 text-center">
      <font-awesome-icon icon="hand" class="mb-4 text-4xl text-slate-900 opacity-30" />
      <p class="text-xl font-bold italic leading-relaxed text-slate-900">
        "OrganizeHome cambió por completo la dinámica de mi hogar. Por primera vez, sé exactamente qué tengo y dónde está cada cosa. Es una herramienta indispensable para cualquier hogar moderno."
      </p>
      <div class="mt-8 flex items-center justify-center gap-4">
        <div class="h-12 w-12 overflow-hidden rounded-full border-4 border-slate-900 bg-sky-200">
          <font-awesome-icon icon="user" class="mt-3 w-full text-2xl text-slate-700" />
        </div>
        <div class="text-left">
          <p class="font-extrabold text-slate-900">Elena Rodríguez</p>
          <p class="text-sm text-slate-600">Arquitecta de Interiores</p>
        </div>
      </div>
    </div>
  </section>
</template>

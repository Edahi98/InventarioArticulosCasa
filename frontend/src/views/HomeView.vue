<script setup lang="ts">
import { useRouter } from "vue-router";
import { listHomeBears } from "../core/usecases/listHomeBears.js";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";
import HomeCategoryBears from "../components/home/HomeCategoryBears.vue";
import HomeClosing from "../components/home/HomeClosing.vue";
import HomeFeatures from "../components/home/HomeFeatures.vue";
import HomeHero from "../components/home/HomeHero.vue";

const router = useRouter();
const bears = listHomeBears();

function goToDashboard(): void {
  if (authenticatedHttpClient.isAuthenticated()) {
    router.push("/categories");
    return;
  }
  router.push({ path: "/login", query: { redirect: "/categories" } });
}
</script>

<template>
  <div class="landing">
    <HomeHero @enter="goToDashboard" />
    <HomeCategoryBears :bears="bears" />
    <HomeFeatures />
    <HomeClosing :bears="bears.slice(0, 3)" @enter="goToDashboard" />
  </div>
</template>

<style>
.landing {
  min-height: 100dvh;
  color: var(--l-ink);
  font-family: var(--l-font);
}

.landing-choice {
  border-radius: 9999px;
  background: var(--l-surface);
  color: var(--l-ink);
  padding: 0.8rem 1.25rem;
  text-align: center;
  font-weight: 800;
  box-shadow: 0 5px 0 var(--l-toy-edge);
  transition: background-color 160ms ease, color 160ms ease, transform 120ms ease, box-shadow 120ms ease;
}

.landing-choice:active {
  transform: translateY(4px);
  box-shadow: 0 1px 0 var(--l-toy-edge);
}

.landing-choice:hover {
  background: var(--l-surface-2);
}

.landing-choice:focus-visible {
  outline: 2px solid var(--l-accent);
  outline-offset: 3px;
}

.landing-choice-active,
.landing-choice-active:hover {
  background: var(--l-accent);
  color: var(--l-on-accent);
  box-shadow: 0 5px 0 var(--l-accent-edge);
}
</style>

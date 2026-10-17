<script setup lang="ts">
import { useRouter } from "vue-router";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";
import { useTheme } from "../composables/useTheme.js";
import AppLogoBadge from "./AppLogoBadge.vue";

const router = useRouter();
const { isDark, toggle: toggleTheme } = useTheme();

async function handleLogout(): Promise<void> {
  await authenticatedHttpClient.logout();
  router.push("/login");
}
</script>

<template>
  <header class="sticky top-3 z-20 px-3" style="font-family: var(--l-font)">
    <div
      class="ui-toy mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-full bg-[var(--l-surface)] pl-3 pr-3 md:pr-4"
    >
      <router-link
        to="/"
        class="flex min-w-0 items-center gap-2 rounded-full pr-3 text-xl text-[var(--l-ink)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--l-ink)]"
        style="font-family: var(--l-display)"
      >
        <AppLogoBadge />
        <span class="hidden sm:inline">Guardacosas</span>
      </router-link>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="ui-btn ui-btn-sm ui-btn-ghost !px-3"
          :aria-label="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          :title="isDark ? 'Tema claro' : 'Tema oscuro'"
          @click="toggleTheme"
        >
          <font-awesome-icon :icon="isDark ? 'sun' : 'moon'" />
        </button>

        <nav v-if="authenticatedHttpClient.isAuthenticated()" class="flex items-center gap-2" aria-label="Principal">
          <router-link to="/search" class="ui-btn ui-btn-sm ui-btn-ghost" aria-label="Buscar">
            <font-awesome-icon icon="magnifying-glass" />
            <span class="hidden lg:inline">Buscar</span>
          </router-link>
          <router-link to="/telegram" class="ui-btn ui-btn-sm ui-btn-ghost" aria-label="Telegram">
            <font-awesome-icon icon="paper-plane" />
            <span class="hidden lg:inline">Telegram</span>
          </router-link>
          <router-link to="/users" class="ui-btn ui-btn-sm ui-btn-ghost" aria-label="Habitantes">
            <font-awesome-icon icon="user" />
            <span class="hidden lg:inline">Habitantes</span>
          </router-link>
          <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" @click="handleLogout">Salir</button>
        </nav>
      </div>
    </div>
  </header>
</template>

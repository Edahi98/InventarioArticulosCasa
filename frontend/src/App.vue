<script setup lang="ts">
import { useRouter } from "vue-router";
import { authenticatedHttpClient } from "./services/http/AuthenticatedHttpClient.js";

const router = useRouter();

function handleLogout(): void {
  authenticatedHttpClient.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-amber-50">
    <header class="flex items-center justify-between border-b-4 border-slate-900 bg-yellow-200 px-6 py-3">
      <router-link to="/" class="text-lg font-extrabold text-slate-900">
        <font-awesome-icon icon="box" class="mr-1" /> Inventario
      </router-link>
      <div v-if="authenticatedHttpClient.isAuthenticated()" class="flex gap-2">
        <router-link to="/search" class="cartoon-btn-secondary px-3 py-1 text-sm">
          <font-awesome-icon icon="magnifying-glass" class="mr-1" /> Buscar
        </router-link>
        <router-link to="/users" class="cartoon-btn-secondary px-3 py-1 text-sm">
          <font-awesome-icon icon="user" class="mr-1" /> Usuarios
        </router-link>
        <button class="cartoon-btn-danger px-3 py-1 text-sm" @click="handleLogout">Salir</button>
      </div>
    </header>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
</script>

<template>
  <div class="min-h-screen bg-[var(--l-bg)]">
    <AppHeader />
    <router-view />
  </div>
</template>

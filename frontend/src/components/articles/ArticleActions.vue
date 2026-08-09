<script setup lang="ts">
import { ref } from "vue";
import type { Article } from "../../core/domain/article.js";
import ArticleDeleteModal from "./ArticleDeleteModal.vue";

const props = defineProps<{ article: Article }>();
const emit = defineEmits<{ deleted: [id: number] }>();

const isDeleteModalOpen = ref(false);

function handleDeleted(id: number): void {
  isDeleteModalOpen.value = false;
  emit("deleted", id);
}
</script>

<template>
  <div class="flex gap-2">
    <router-link
      :to="`/articles/${article.id}/edit`"
      class="cartoon-btn-secondary px-3 py-1.5 text-sm"
      @click.stop
    >
      Editar
    </router-link>
    <button
      class="cartoon-btn-danger px-3 py-1.5 text-sm"
      @click.stop="isDeleteModalOpen = true"
    >
      Eliminar
    </button>

    <ArticleDeleteModal
      v-if="isDeleteModalOpen"
      :article="article"
      @close="isDeleteModalOpen = false"
      @deleted="handleDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Article } from "../../core/domain/article.js";
import ArticleDeleteModal from "./ArticleDeleteModal.vue";

defineProps<{ article: Article }>();
const emit = defineEmits<{ deleted: [id: number] }>();

const isDeleteModalOpen = ref(false);

function handleDeleted(id: number): void {
  isDeleteModalOpen.value = false;
  emit("deleted", id);
}
</script>

<template>
  <div class="flex gap-2">
    <router-link :to="`/articles/${article.id}/edit`" class="ui-btn ui-btn-sm ui-btn-ghost" @click.stop>
      <font-awesome-icon icon="pen" /> Editar
    </router-link>
    <button type="button" class="ui-btn ui-btn-sm ui-btn-danger" @click.stop="isDeleteModalOpen = true">
      <font-awesome-icon icon="trash" /> Eliminar
    </button>

    <ArticleDeleteModal
      v-if="isDeleteModalOpen"
      :article="article"
      @close="isDeleteModalOpen = false"
      @deleted="handleDeleted"
    />
  </div>
</template>

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Author } from "@/types";

export const useAuthorsStore = defineStore("authors", () => {
  // ----------------------------------
  // State
  // ----------------------------------
  const authorsById = ref < Record<string, Author>({});

  // ----------------------------------
  // Getters
  // ----------------------------------
  const allAuthors = computed(() => Object.values(authorsById.value));

  const getAuthorById = (id: string | null | undefined) =>
    computed(() => (id ? authorsById.value[id] : undefined));

  // ----------------------------------
  // Actions
  // ----------------------------------
  function upsertAuthors(authors: Author[]) {
    for (const author of authors) {
      authorsById.value[author.id] = author;
    }
  }

  function upsertAuthor(author: Author) {
    authorsById.value[author.id] = author;
  }

  return {
    // state
    authorsById,

    // getters
    allAuthors,
    getAuthorById,

    // actions
    upsertAuthors,
    upsertAuthor,
  };
});

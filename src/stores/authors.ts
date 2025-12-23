import { defineStore } from "pinia";
import { ref, computed } from "vue";

import type { Author, GroupedAuthors, AuthorId } from "@/types";
import { sortAuthors, getActiveAuthors } from "@/utils";

import { authors as testAuthors } from "@/test/test-authors";

export const useAuthorsStore = defineStore("authors", () => {
  // ----------------------------------
  // STATE
  // ----------------------------------
  const authorsById = ref<Record<string, Author>>({});

  // ----------------------------------
  // GETTERS
  // ----------------------------------
  const allAuthors = computed(() => Object.values(authorsById.value));

  const getAuthorById = (id: AuthorId | null | undefined) =>
    computed(() => (id ? authorsById.value[id] : undefined));

  // Sorts authors by teams, then by last name
  const groupedAuthors = computed<GroupedAuthors>(() => sortAuthors(allAuthors.value));

  const activeGroupedAuthors = computed<GroupedAuthors>(() =>
    getActiveAuthors(groupedAuthors.value)
  );

  // ----------------------------------
  // ACTIONS - Core Mutators
  // ----------------------------------
  function upsertAuthors(authors: Author[]) {
    for (const author of authors) {
      authorsById.value[author.id] = author;
    }
  }

  function upsertAuthor(author: Author) {
    authorsById.value[author.id] = author;
  }

  // ----------------------------------
  // ACTIONS - Loading with Test Fallback
  // ----------------------------------
  function initializeAuthors() {
    upsertAuthors(testAuthors);
  }

  return {
    // state
    authorsById,

    // getters
    allAuthors,
    getAuthorById,
    groupedAuthors,
    activeGroupedAuthors,

    // actions
    upsertAuthors,
    upsertAuthor,

    // loading
    initializeAuthors,
  };
});

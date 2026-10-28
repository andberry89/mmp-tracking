import { defineStore } from "pinia";
import { ref, computed } from "vue";

import type { Author, GroupedAuthors, AuthorId, AuthorTeamSlug } from "@/types";
import { sortAuthors, getActiveAuthors } from "@/utils";

import { authors as testAuthors } from "@/test/test-authors";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { fetchAuthors } from "@/lib/supabase-data";

export const useAuthorsStore = defineStore("authors", () => {
  // ----------------------------------
  // STATE
  // ----------------------------------
  const authorsById = ref<Record<string, Author>>({});
  const error = ref<string | null>(null);

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

  async function saveAuthor(input: {
    id?: string;
    firstName: string;
    lastName: string;
    team: AuthorTeamSlug;
    active?: boolean;
  }) {
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    if (!firstName || !lastName) throw new Error("Enter the author’s first and last name.");
    const label = `${firstName} ${lastName}`;
    const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
    const team = authorTeams[input.team];
    const author: Author = {
      id: (input.id ?? `demo-author:${label.toLowerCase().replace(/\s+/g, "-")}`) as AuthorId,
      firstName,
      lastName,
      label,
      initials,
      team,
      active: input.active ?? true,
    };

    if (!isSupabaseConfigured || !supabase) {
      upsertAuthor(author);
      return;
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      label,
      initials,
      team: input.team,
      active: input.active ?? true,
    };
    const result = input.id
      ? await supabase.from("authors").update(payload).eq("id", input.id)
      : await supabase.from("authors").insert(payload);
    if (result.error) throw new Error(result.error.message);
    await loadAuthors();
  }

  async function setAuthorActive(author: Author, active: boolean) {
    await saveAuthor({
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      team: author.team.slug,
      active,
    });
  }

  // ----------------------------------
  // ACTIONS - Loading with Test Fallback
  // ----------------------------------
  function initializeAuthors() {
    upsertAuthors(testAuthors);
  }

  async function loadAuthors() {
    if (!isSupabaseConfigured) {
      initializeAuthors();
      return;
    }

    error.value = null;
    try {
      const authors = await fetchAuthors();
      authorsById.value = Object.fromEntries(authors.map((author) => [author.id, author]));
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : "Unable to load authors.";
      authorsById.value = {};
    }
  }

  return {
    // state
    authorsById,
    error,

    // getters
    allAuthors,
    getAuthorById,
    groupedAuthors,
    activeGroupedAuthors,

    // actions
    upsertAuthors,
    upsertAuthor,
    saveAuthor,
    setAuthorActive,

    // loading
    initializeAuthors,
    loadAuthors,
  };
});

const authorTeams = {
  bg: { slug: "bg", label: "Buyer's Guide", sidebar: "BG" },
  cd: { slug: "cd", label: "Car and Driver", sidebar: "C/D" },
  freelance: { slug: "freelance", label: "Freelancers", sidebar: "FL" },
} as const;

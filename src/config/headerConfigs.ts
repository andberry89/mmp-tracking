import type { DropdownConfig, GroupedAuthors } from "@/types";

export interface MmpHeaderConfigParams {
  authors: GroupedAuthors;
  setAuthor: (id: string) => void;
}

/** Build the search and filter controls used by the Publication Tracking header. */
export function getHeaderConfig({ authors, setAuthor }: MmpHeaderConfigParams) {
  const authorOptions = authors.all
    .filter((author) => author.active)
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((author) => ({ id: author.id, label: author.label }));

  return {
    title: "MMPs",
    searchPlaceholder: "Search by make, model, year or segment...",
    dropdowns: [
      {
        id: "author",
        label: "Author",
        options: authorOptions,
        onSelect: setAuthor,
        class: "min-w-[175px]",
      },
    ] satisfies DropdownConfig[],
  };
}

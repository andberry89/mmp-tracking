import type { DropdownConfig } from "@/types";
import type { AuthorGroups } from "@/types";

export interface HeaderConfigFactoryParams {
  authors: AuthorGroups;
  ranges: Array<{ id: string; label: string }>;
  setAuthor: (id: string) => void;
  setRange: (id: string) => void;
  setStatus: (id: string) => void;
  setMake: (id: string) => void;
}

/**
 * Returns a config object for each page header.
 * Keeps MainContent.vue cleaner.
 */
export const getHeaderConfig = (
  activeLabel: string,
  { authors, ranges, setAuthor, setRange, setStatus, setMake }: HeaderConfigFactoryParams
) => {
  const activeAuthorsByLastName = authors.all
    .filter((a) => a.active)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const authorOptions = activeAuthorsByLastName.map((a) => ({ id: a.id, label: a.label }));

  const baseStatuses = [
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  switch (activeLabel) {
    case "MMPs":
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
          {
            id: "range",
            label: "Date Range",
            options: ranges,
            onSelect: setRange,
            class: "min-w-[160px]",
          },
        ] satisfies DropdownConfig[],
      };
    case "Makes":
      return {
        title: "Makes",
        searchPlaceholder: "Search by make...",
        dropdowns: [
          {
            id: "status",
            label: "Status",
            options: baseStatuses,
            onSelect: setStatus,
            class: "min-w-[130px]",
          },
          {
            id: "range",
            label: "Range",
            options: ranges,
            onSelect: setRange,
            class: "min-w-[130px]",
          },
        ],
      };
    case "Models":
      return {
        title: "Models",
        searchPlaceholder: "Search by make or model...",
        dropdowns: [
          {
            id: "make",
            label: "Make",
            options: [
              { id: "toyota", label: "Toyota" },
              { id: "ford", label: "Ford" },
            ],
            onSelect: setMake,
            class: "min-w-[175px]",
          },
          {
            id: "status",
            label: "Status",
            options: baseStatuses,
            onSelect: setStatus,
            class: "min-w-[130px]",
          },
        ],
      };
    case "Segments":
      return { title: "Segments", searchPlaceholder: "Search by segment..." };
    case "Authors":
      return {
        title: "Authors",
        searchPlaceholder: "Search by name...",
        dropdowns: [
          {
            id: "status",
            label: "Status",
            options: baseStatuses,
            onSelect: setStatus,
            class: "min-w-[130px]",
          },
        ],
      };
    default:
      return {
        title: "MMPs",
        searchPlaceholder: "Search by make or segment...",
        dropdowns: [
          {
            id: "author",
            label: "Author",
            options: authorOptions,
            onSelect: setAuthor,
            class: "min-w-[175px]",
          },
          {
            id: "range",
            label: "Status",
            options: ranges,
            onSelect: setRange,
            class: "min-w-[130px]",
          },
        ],
      };
  }
};

import type { AuthorId } from "./ids";

export type AuthorTeamSlug = "bg" | "cd" | "freelance"; // extend with more if needed

export interface AuthorTeam {
  slug: AuthorTeamSlug;
  label: string;
  sidebar: string;
}

export interface Author {
  id: AuthorId;
  firstName: string;
  lastName: string;
  label: string;
  initials: string;
  team: AuthorTeam;
  active: boolean;
}

export type GroupedByTeam<T> = Record<AuthorTeamsSlug, T[]> & {
  all: T[];
};

export type GroupedAuthors = GroupedByTeam<Author>;

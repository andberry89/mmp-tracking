export interface AuthorTeam {
  slug: "bg" | "cd" | "freelance"; // extend with more if needed
  label: "Buyer's Guide" | "Car and Driver" | "Freelance";
}

export interface Author {
  id: string;
  firstName: string;
  lastName: string;
  label: string;
  initials: string;
  team: AuthorTeam;
  active: boolean;
}

export type AuthorGroups = {
  bg: Author[];
  cd: Author[];
  freelance: Author[];
  all: Author[];
};

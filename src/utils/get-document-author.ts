import type { TaskDocument, Author } from "@/types";
import { useAuthorsStore } from "@/stores/authors";

export function getDocumentAuthor(doc: TaskDocument): Author | null {
  if (!doc.authorId) return null;

  const authorsStore = useAuthorsStore();
  return authorsStore.getAuthorById(doc.authorId).value ?? null;
}

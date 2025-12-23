/**
 * Branded IDs
 * These are still strings at runtime,
 * but are distinct types at compile time.
 */

export type AuthorId = string & { readonly __brand: "AuthorId" };

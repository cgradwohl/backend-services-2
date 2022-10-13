export function getUserIdsFromScopes(scopes: string[]): string[] {
  return scopes
    .filter((s) => s.startsWith("user_id:"))
    .map((s) => s.replace("user_id:", ""));
}

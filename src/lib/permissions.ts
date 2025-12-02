export function getPermissions(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("gc_permissions");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function hasPermission(perm: string): boolean {
  return getPermissions().includes(perm);
}

// Role-checking helpers

export function isWriteAllowed(role: string): boolean {
  return role === "admin" || role === "hr";
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}

export function isReadOnly(role: string): boolean {
  return role === "executive";
}

export function canViewAllData(role: string): boolean {
  return role === "admin" || role === "hr" || role === "executive";
}

export function canManageDeptOnly(role: string): boolean {
  return role === "manager";
}

export function canOnlyViewSelf(role: string): boolean {
  return role === "employee";
}

export enum AppRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  GYM_SUPERVISOR = 'GYM_SUPERVISOR',
  RECEPTIONIST = 'RECEPTIONIST',
  USER = 'USER',
}

export const PlatformAdminRoles = [
  AppRole.OWNER,
  AppRole.MANAGER,
  AppRole.SUPERVISOR,
] as const;

export const GymAdminRoles = [
  AppRole.GYM_SUPERVISOR,
  AppRole.RECEPTIONIST,
] as const;

export const AnyAdminRoles = [...PlatformAdminRoles, ...GymAdminRoles] as const;

export type RoleLike = AppRole | `${AppRole}`;

/** Helper: checks whether the user has any of the allowed roles */
export function hasAnyRole(
  userRoles: readonly string[] | undefined,
  allowed: readonly RoleLike[],
): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  const set = new Set(userRoles.map(String));
  return allowed.some((r) => set.has(String(r)));
}

import {
  AppRole,
  PlatformAdminRoles,
  GymAdminRoles,
  hasAnyRole,
} from '../auth/app-roles';

export enum ReportingPermission {
  // Platform-level (whole platform)
  PLATFORM_VIEW = 'PLATFORM_VIEW',
  PLATFORM_EXPORT = 'PLATFORM_EXPORT',

  // Gym-level (restricted to a gym/branch scope)
  GYM_VIEW = 'GYM_VIEW',
  GYM_EXPORT = 'GYM_EXPORT',

  // End-user
  USER_SELF_VIEW = 'USER_SELF_VIEW',
}

export type RoleList = readonly string[] | undefined;

/** Has any platform admin role? (OWNER/MANAGER/SUPERVISOR) */
export function isPlatformAdmin(roles: RoleList): boolean {
  return hasAnyRole(roles, PlatformAdminRoles);
}

/** Has any gym admin role? (GYM_SUPERVISOR/RECEPTIONIST) */
export function isGymAdmin(roles: RoleList): boolean {
  return hasAnyRole(roles, GymAdminRoles);
}

/** Platform: view general reports (KPI, Top Gyms, etc.) */
export function canPlatformView(roles: RoleList): boolean {
  return isPlatformAdmin(roles);
}

/** Platform: export general reports (CSV/PDF) */
export function canPlatformExport(roles: RoleList): boolean {
  return isPlatformAdmin(roles);
}

/** Gym: view reports limited to its own gym/branches */
export function canGymView(roles: RoleList): boolean {
  return isGymAdmin(roles) || isPlatformAdmin(roles); // platform admins may view any gym too
}

/** Gym: export reports limited to its own gym/branches */
export function canGymExport(roles: RoleList): boolean {
  return isGymAdmin(roles) || isPlatformAdmin(roles);
}

/** User: view self data only (controller will verify userId match) */
export function canUserSelfView(roles: RoleList): boolean {
  return (
    hasAnyRole(roles, [AppRole.USER]) ||
    isPlatformAdmin(roles) ||
    isGymAdmin(roles)
  );
}

/** Minimal request scope (can be extended later if needed) */
export interface RequestScope {
  gymId?: number; // when wiring, compare gymId from token/request
  userId?: number; // for "User Self" checks
}

/**
 * Centralized permission checker.
 * Controllers/guards can call this to verify access based on roles (+optional scope).
 */
export function checkReportingPermission(
  roles: RoleList,
  permission: ReportingPermission,
): boolean {
  switch (permission) {
    case ReportingPermission.PLATFORM_VIEW:
      return canPlatformView(roles);
    case ReportingPermission.PLATFORM_EXPORT:
      return canPlatformExport(roles);
    case ReportingPermission.GYM_VIEW:
      return canGymView(roles);
    case ReportingPermission.GYM_EXPORT:
      return canGymExport(roles);
    case ReportingPermission.USER_SELF_VIEW:
      return canUserSelfView(roles);
    default:
      return false;
  }
}

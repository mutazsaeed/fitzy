import { SetMetadata } from '@nestjs/common';
import { AdminRole, GymAdminRole } from '@prisma/client';

export type AppRole = AdminRole | GymAdminRole;

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AppRole } from './roles.decorator';

interface JwtUser {
  userId: number;
  type: string; // USER | ADMIN | GYM_ADMIN
  role?: AppRole | null;
  gymId?: number | null;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtUser }>();
    const { user } = request;

    return requiredRoles.includes(user.role ?? ('' as AppRole));
  }
}

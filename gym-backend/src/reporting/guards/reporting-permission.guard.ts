// src/reporting/guards/reporting-permission.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { REPORTING_PERMISSION_KEY } from '../decorators/permission.decorator';
import {
  ReportingPermission,
  checkReportingPermission,
} from '../reporting.policy';

type JwtUserShape = {
  role?: string;
  roles?: string[];
};

function normalizeRoles(user?: JwtUserShape): readonly string[] | undefined {
  if (Array.isArray(user?.roles)) {
    return user.roles.map(String);
  }
  if (user?.role) {
    return [String(user.role)];
  }
  return undefined;
}

@Injectable()
export class ReportingPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<ReportingPermission>(
      REPORTING_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission is attached, allow (no change in behavior).
    if (!permission) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUserShape }>();

    const roles: readonly string[] | undefined = normalizeRoles(req.user);

    // Policy currently uses roles only (scope-less).
    return checkReportingPermission(roles, permission);
  }
}

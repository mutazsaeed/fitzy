import { SetMetadata } from '@nestjs/common';
import { ReportingPermission } from '../reporting.policy';

export const REPORTING_PERMISSION_KEY = 'reporting:permission';

export const ReportingPermissionRequired = (permission: ReportingPermission) =>
  SetMetadata(REPORTING_PERMISSION_KEY, permission);

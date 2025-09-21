import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GymAdminService } from './gym-admin.service';
import { GymAdminRole } from '@prisma/client';

interface JwtRequest extends Request {
  user: { id: number; role: GymAdminRole; gymId: number };
}

@Controller('gym-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GymAdminController {
  constructor(private readonly gymAdminService: GymAdminService) {}

  // ✅ GET /gym-admin/visits → عرض زيارات النادي (GYM_SUPERVISOR فقط)
  @Get('visits')
  @Roles(GymAdminRole.GYM_SUPERVISOR)
  async getVisits(@Request() req: JwtRequest) {
    return this.gymAdminService.getVisits(req.user);
  }

  // ✅ GET /gym-admin/reports → تقارير الحضور (GYM_SUPERVISOR فقط)
  @Get('reports')
  @Roles(GymAdminRole.GYM_SUPERVISOR)
  async getReports(@Request() req: JwtRequest) {
    return this.gymAdminService.getReports(req.user);
  }

  // ✅ POST /gym-admin/scan → تسجيل زيارة QR (RECEPTIONIST فقط)
  @Post('scan')
  @Roles(GymAdminRole.RECEPTIONIST)
  async scanQr(@Request() req: JwtRequest, @Body() body: { userId: number }) {
    return this.gymAdminService.scanQr(req.user, body.userId);
  }
}

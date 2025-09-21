/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '@prisma/client';
import { AdminService } from './admin.service';

interface JwtRequest extends Request {
  user: { id: number; role: AdminRole };
}

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ الحماية بالتوكن + الأدوار
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ✅ GET /admins → جلب كل الأدمنز (OWNER و MANAGER فقط)
  @Get()
  @Roles('OWNER', 'MANAGER')
  async getAllAdmins(@Request() req: JwtRequest) {
    return this.adminService.getAllAdmins(req.user);
  }

  // ✅ POST /admins → إضافة أدمن جديد (OWNER فقط)
  @Post()
  @Roles('OWNER')
  async createAdmin(
    @Request() req: JwtRequest,
    @Body() body: { name: string; email: string; password: string; role: AdminRole },
  ) {
    return this.adminService.createAdmin(req.user, body);
  }

  // ✅ GET /admins/:id → جلب أدمن واحد (OWNER, MANAGER, SUPERVISOR)
  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'SUPERVISOR')
  async getAdminById(@Request() req: JwtRequest, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.getAdminById(req.user, id);
  }

  // ✅ PUT /admins/:id → تحديث أدمن (OWNER فقط)
  @Put(':id')
  @Roles('OWNER')
  async updateAdmin(
    @Request() req: JwtRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<{ name: string; email: string; password: string; role: AdminRole }>,
  ) {
    return this.adminService.updateAdmin(req.user, id, body);
  }

  // ✅ DELETE /admins/:id → حذف أدمن (OWNER فقط)
  @Delete(':id')
  @Roles('OWNER')
  async deleteAdmin(@Request() req: JwtRequest, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteAdmin(req.user, id);
  }

  // ✅ GET /admins/reports → تقارير (SUPERVISOR + MANAGER + OWNER)
  @Get('reports')
  @Roles('SUPERVISOR', 'MANAGER', 'OWNER')
  async getReports(@Request() req: JwtRequest) {
    return this.adminService.getReports(req.user);
  }
}

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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ كل المسارات محمية بالتوكن + الأدوار
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ✅ GET /users → جلب كل المستخدمين (مسموح فقط للـ OWNER أو MANAGER)
  @Get()
  @Roles('OWNER', 'MANAGER')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  // ✅ POST /users → إنشاء مستخدم جديد (مسموح للـ OWNER أو MANAGER)
  @Post()
  @Roles('OWNER', 'MANAGER')
  createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }

  // ✅ GET /users/:id → جلب مستخدم واحد (مسموح لـ OWNER, MANAGER, SUPERVISOR)
  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'SUPERVISOR')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  // ✅ PUT /users/:id → تحديث بيانات مستخدم (مسموح للـ OWNER أو MANAGER فقط)
  @Put(':id')
  @Roles('OWNER', 'MANAGER')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<CreateUserDto>,
  ) {
    return this.userService.updateUser(id, body);
  }

  // ✅ DELETE /users/:id → حذف مستخدم واحد (مسموح للـ OWNER فقط)
  @Delete(':id')
  @Roles('OWNER')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }

  // ✅ DELETE /users → حذف كل المستخدمين (مسموح للـ OWNER فقط)
  @Delete()
  @Roles('OWNER')
  deleteAllUsers() {
    return this.userService.deleteAllUsers();
  }

  // ✅ POST /users/bulk → إنشاء عدة مستخدمين دفعة وحدة (مسموح للـ OWNER أو MANAGER)
  @Post('bulk')
  @Roles('OWNER', 'MANAGER')
  createManyUsers(@Body() body: { users: CreateUserDto[] }) {
    return this.userService.createManyUsers(body.users);
  }
}

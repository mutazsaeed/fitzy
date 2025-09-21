import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ✅ إنشاء مستخدم جديد
  async createUser(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  // ✅ جلب جميع المستخدمين
  async getAllUsers() {
    return this.prisma.user.findMany();
  }

  // ✅ جلب مستخدم واحد بالـ ID
  async getUserById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // ✅ تعديل بيانات مستخدم
  async updateUser(id: number, data: Partial<CreateUserDto>) {
    const updateData: Partial<CreateUserDto> = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  // ✅ حذف مستخدم واحد بالـ id
  async deleteUser(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  // ✅ حذف كل المستخدمين
  async deleteAllUsers() {
    return this.prisma.user.deleteMany();
  }

  // ✅ إنشاء عدة مستخدمين دفعة وحدة
  async createManyUsers(users: CreateUserDto[]) {
    const usersWithHashed = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 12),
      })),
    );

    return this.prisma.user.createMany({
      data: usersWithHashed,
      skipDuplicates: true, // يتجاهل الإيميل أو رقم الجوال المكرر
    });
  }
}

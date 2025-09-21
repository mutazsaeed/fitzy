/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';

@Injectable()
export class GymService {
  constructor(private prisma: PrismaService) {}

  // ✅ إنشاء نادي جديد
  async createGym(data: CreateGymDto) {
    return await this.prisma.gym.create({
      data: {
        name: data.name,
        logo: data.logo,
        images: data.images,
        gender: data.gender,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        workingHours: data.workingHours,
        services: data.services,
        visitPrice: data.visitPrice,
      },
    });
  }

  // ✅ إنشاء عدة أندية دفعة واحدة
  async createManyGyms(data: CreateGymDto[]) {
    return await this.prisma.gym.createMany({
      data,
      skipDuplicates: true, // يتجاوز أي نادي مكرر
    });
  }

  // ✅ جلب جميع الأندية
  async getAllGyms() {
    return await this.prisma.gym.findMany({
      include: { subscriptions: true },
    });
  }

  // ✅ جلب نادي واحد بالـ id
  async getGymById(id: number) {
    return await this.prisma.gym.findUnique({
      where: { id },
      include: { subscriptions: true },
    });
  }

  // ✅ تحديث نادي
  async updateGym(id: number, data: UpdateGymDto) {
    return await this.prisma.gym.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.logo && { logo: data.logo }),
        ...(data.images && { images: data.images }),
        ...(data.gender && { gender: data.gender }),
        ...(data.category && { category: data.category }),
        ...(data.latitude && { latitude: data.latitude }),
        ...(data.longitude && { longitude: data.longitude }),
        ...(data.address && { address: data.address }),
        ...(data.workingHours && { workingHours: data.workingHours }),
        ...(data.services && { services: data.services }),
        ...(data.visitPrice && { visitPrice: data.visitPrice }),
      },
    });
  }

  // ✅ حذف نادي واحد
  async deleteGym(id: number) {
    return await this.prisma.gym.delete({
      where: { id },
    });
  }

  // ✅ حذف جميع الأندية
  async deleteAllGyms() {
    return await this.prisma.gym.deleteMany();
  }
}

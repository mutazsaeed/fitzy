import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // ✅ إنشاء باقة جديدة
  async createSubscription(data: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        name: data.name,
        gender: data.gender,
        level: data.level,
        price: data.price,
        duration: data.duration,
        promoImage: data.promoImage,
      },
    });
  }

  // ✅ جلب كل الباقات
  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { gyms: true, users: true }, // عشان نرجع العلاقات كمان
    });
  }

  // ✅ جلب باقة واحدة بالـ id
  async getSubscriptionById(id: number) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: { gyms: true, users: true },
    });
  }

  // ✅ تحديث باقة
  async updateSubscription(id: number, data: Partial<CreateSubscriptionDto>) {
    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.gender && { gender: data.gender }),
        ...(data.level && { level: data.level }),
        ...(data.price && { price: data.price }),
        ...(data.duration && { duration: data.duration }),
        ...(data.promoImage && { promoImage: data.promoImage }),
      },
    });
  }

  // ✅ حذف باقة واحدة
  async deleteSubscription(id: number) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }

  // ✅ حذف كل الباقات
  async deleteAllSubscriptions() {
    return this.prisma.subscription.deleteMany();
  }

  // ✅ ربط مستخدم بباقة (Many-to-Many)
  async assignUserToSubscription(userId: number, subscriptionId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptions: {
          connect: { id: subscriptionId },
        },
      },
      include: { subscriptions: true },
    });
  }

  // ✅ ربط نادي بباقة (Many-to-Many)
  async assignGymToSubscription(subscriptionId: number, gymId: number) {
    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        gyms: {
          connect: { id: gymId },
        },
      },
      include: { gyms: true },
    });
  }
}

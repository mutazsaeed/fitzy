import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateVisitDto) {
    // تاريخ اليوم (بداية اليوم بدون وقت)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingVisit = await this.prisma.visit.findFirst({
      where: {
        userId: data.userId,
        gymId: data.gymId,
        visitDate: today,
      },
    });

    if (existingVisit) {
      throw new BadRequestException(
        'User already checked in today at this gym',
      );
    }

    return this.prisma.visit.create({
      data: {
        userId: data.userId,
        gymId: data.gymId,
        subscriptionId: data.subscriptionId,
        status: data.status,
        method: data.method,
        notes: data.notes,
        visitDate: today,
      },
    });
  }

  async findAll() {
    return this.prisma.visit.findMany({
      include: {
        user: true,
        gym: true,
        subscription: true,
      },
    });
  }
}

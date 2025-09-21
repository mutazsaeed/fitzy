import { Module } from '@nestjs/common';
import { GymService } from './gym.service';
import { GymController } from './gym.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // 👈 هنا أضفنا PrismaModule
  providers: [GymService],
  controllers: [GymController],
  exports: [GymService],
})
export class GymModule {}

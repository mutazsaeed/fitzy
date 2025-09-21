/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { GymService } from './gym.service';
import { CreateGymDto } from './dto/create-gym.dto';
import { UpdateGymDto } from './dto/update-gym.dto';

@Controller('gyms')
export class GymController {
  constructor(private readonly gymService: GymService) {}

  // ✅ إنشاء نادي جديد
  @Post()
  async createGym(@Body() data: CreateGymDto) {
    return await this.gymService.createGym(data);
  }

  // ✅ إنشاء عدة أندية دفعة واحدة
  @Post('bulk')
  async createManyGyms(@Body() body: { gyms: CreateGymDto[] }) {
    return await this.gymService.createManyGyms(body.gyms);
  }

  // ✅ جلب جميع الأندية
  @Get()
  async getAllGyms() {
    return await this.gymService.getAllGyms();
  }

  // ✅ جلب نادي واحد بالـ id
  @Get(':id')
  async getGymById(@Param('id', ParseIntPipe) id: number) {
    return await this.gymService.getGymById(id);
  }

  // ✅ تحديث نادي
  @Put(':id')
  async updateGym(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateGymDto,
  ) {
    return await this.gymService.updateGym(id, data);
  }

  // ✅ حذف نادي واحد
  @Delete(':id')
  async deleteGym(@Param('id', ParseIntPipe) id: number) {
    return await this.gymService.deleteGym(id);
  }

  // ✅ حذف جميع الأندية
  @Delete()
  async deleteAllGyms() {
    return await this.gymService.deleteAllGyms();
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ✅ POST /subscriptions → إنشاء باقة جديدة
  @Post()
  createSubscription(@Body() body: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(body);
  }

  // ✅ GET /subscriptions → جلب كل الباقات
  @Get()
  getAllSubscriptions() {
    return this.subscriptionService.getAllSubscriptions();
  }

  // ✅ GET /subscriptions/:id → جلب باقة واحدة
  @Get(':id')
  getSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.getSubscriptionById(id);
  }

  // ✅ PUT /subscriptions/:id → تحديث باقة
  @Put(':id')
  updateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<CreateSubscriptionDto>,
  ) {
    return this.subscriptionService.updateSubscription(id, body);
  }

  // ✅ DELETE /subscriptions/:id → حذف باقة واحدة
  @Delete(':id')
  deleteSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.deleteSubscription(id);
  }

  // ✅ DELETE /subscriptions → حذف جميع الباقات
  @Delete()
  deleteAllSubscriptions() {
    return this.subscriptionService.deleteAllSubscriptions();
  }

  // ✅ POST /subscriptions/:subscriptionId/assign/:userId → ربط مستخدم بباقة
  @Post(':subscriptionId/assign/:userId')
  assignUserToSubscription(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
  ) {
    return this.subscriptionService.assignUserToSubscription(
      userId,
      subscriptionId,
    );
  }

  // ✅ POST /subscriptions/:subscriptionId/assign-gym/:gymId → ربط نادي بباقة
  @Post(':subscriptionId/assign-gym/:gymId')
  assignGymToSubscription(
    @Param('subscriptionId', ParseIntPipe) subscriptionId: number,
    @Param('gymId', ParseIntPipe) gymId: number,
  ) {
    return this.subscriptionService.assignGymToSubscription(
      subscriptionId,
      gymId,
    );
  }
}

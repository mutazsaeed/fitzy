import { Module } from '@nestjs/common';
import { InMemoryCacheService } from './cache.service';

@Module({
  providers: [InMemoryCacheService],
  exports: [InMemoryCacheService],
})
export class CacheModule {}

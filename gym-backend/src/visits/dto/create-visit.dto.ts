/* eslint-disable prettier/prettier */
import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { VisitMethod, VisitStatus } from '@prisma/client';

export class CreateVisitDto {
  @IsInt()
  userId: number;

  @IsInt()
  gymId: number;

  @IsOptional()
  @IsInt()
  subscriptionId?: number;

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @IsOptional()
  @IsEnum(VisitMethod)
  method?: VisitMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

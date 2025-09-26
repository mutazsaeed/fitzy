/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export enum TopGymsSortBy {
  VISITS = 'visits',
  REVENUE = 'revenue',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class TopGymsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  to?: string; // YYYY-MM-DD

  @IsOptional()
  @IsEnum(TopGymsSortBy)
  sortBy?: TopGymsSortBy = TopGymsSortBy.VISITS;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}

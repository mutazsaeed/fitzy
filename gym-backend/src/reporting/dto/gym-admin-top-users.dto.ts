export interface TopUserItemDto {
  userId: number;
  visits: number;
  name?: string;
  email?: string;
}

export interface TopUsersRangeDto {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
}

export interface GymAdminTopUsersDto {
  range: TopUsersRangeDto;
  items: TopUserItemDto[];
}

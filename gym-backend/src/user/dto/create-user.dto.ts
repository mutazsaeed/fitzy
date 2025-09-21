import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Min,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsPhoneNumber('SA')
  phone!: string;

  @IsInt()
  @Min(16)
  age!: number;

  @IsIn(['male', 'female'])
  gender!: 'male' | 'female';

  @IsString()
  @IsNotEmpty()
  city!: string;

  // ✅ باسورد مع تحقق من الطول والقوة
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one symbol',
  })
  password!: string;
}

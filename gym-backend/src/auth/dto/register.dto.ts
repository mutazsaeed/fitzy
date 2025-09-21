import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one symbol',
  })
  password: string;

  @IsNotEmpty()
  role: string; // USER / ADMIN / GYM_ADMIN (نحدد حسب النوع)
}

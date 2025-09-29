import { Controller, Post, Body } from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { UserAuthService } from './user-auth.service';

class UserLoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  password!: string;
}

type UserLoginResponse = {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

@Controller('auth/user')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('login')
  async login(@Body() body: UserLoginDto): Promise<UserLoginResponse> {
    return this.userAuthService.login(body.email, body.password);
  }
}

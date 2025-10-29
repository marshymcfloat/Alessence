import {
  Body,
  Controller,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { DbService } from 'src/db/db.service';
import { AuthService } from './auth.service';
import { AuthRegisterDTO } from '@repo/types/nest';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  async register(@Body() authRegisterDto: AuthRegisterDTO) {
    const newUser = await this.authService.registerUser(authRegisterDto);

    return newUser;
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expiryDate = new Date(Date.now() + sevenDays);
    const user = req.user;

    const { access_token } = await this.authService.login(user);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiryDate,
    });

    return {
      message: 'Login Success',
      user: req.user,
      token: { value: access_token, expires: expiryDate.toISOString() },
    };
  }
}

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
    const user = req.user;
    const accessToken = await this.authService.login(user);

    return accessToken;
  }
}

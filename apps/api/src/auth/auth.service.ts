import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { AuthLoginDTO, AuthRegisterDTO } from '@repo/types/nest';
import { compare, hash } from 'bcryptjs';
import { SafeUser } from '@repo/types';
import { capitalizeString } from '@repo/utils';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: SafeUser) {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  async registerUser(authRegisterDTO: AuthRegisterDTO): Promise<SafeUser> {
    const { email, name, password } = authRegisterDTO;

    const capitalizedName = capitalizeString(name);

    if (!capitalizedName) {
      throw new BadRequestException();
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await this.dbService.user.create({
      data: { email, name, hashedPassword },
    });

    if (!newUser) {
      throw new BadRequestException();
    }

    const { hashedPassword: _, ...safeUser } = newUser;

    return safeUser;
  }

  async validateUser(authLoginDTO: AuthLoginDTO): Promise<SafeUser> {
    const { email, password } = authLoginDTO;

    // Only select fields we need for validation
    const userExists = await this.dbService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        hashedPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userExists) {
      throw new NotFoundException('No user found');
    }

    const correctPassword = await compare(password, userExists.hashedPassword);

    if (!correctPassword) {
      throw new UnauthorizedException('Wrong credentials');
    }

    const { hashedPassword: _, ...safeUser } = userExists;

    return safeUser;
  }
}

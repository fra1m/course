import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../user/entities/user.entity';
import { AuthUserDto } from './dto/authUser.dto';
import { TokenEntity } from './entities/token.entity';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async generateToken(
    user: UserEntity,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET_SECRET'),
      expiresIn: '30m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  validateAccessToken(token: string): JwtPayload | null {
    try {
      const userData = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET_SECRET'),
      });

      return userData;
    } catch {
      return null;
    }
  }

  async validateRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      const userData = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      return userData;
    } catch {
      return null;
    }
  }

  async saveToken(
    user: UserEntity,
    refreshToken: string,
  ): Promise<TokenEntity> {
    const tokenData = await this.tokenRepository.findOne({
      where: { userId: user },
    });

    if (tokenData) {
      tokenData.token = refreshToken;
      return this.tokenRepository.save(tokenData);
    }

    const token = this.tokenRepository.create({
      userId: user,
      token: refreshToken,
    });
    return this.tokenRepository.save(token);
  }

  async removeToken(refreshToken: string): Promise<void> {
    await this.tokenRepository.delete({ token: refreshToken });
  }

  async findToken(refreshToken: string): Promise<TokenEntity | null> {
    return this.tokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['userId'],
    });
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(
      this.configService.getOrThrow<string>('SALT_ROUNDS'),
    );
    return bcrypt.hash(password, saltRounds);
  }

  async auth(userDto: AuthUserDto, user: UserEntity): Promise<UserEntity> {
    const isMatch = await bcrypt.compare(userDto.password, user.password);
    if (!isMatch) {
      throw new HttpException(
        'Неверный логин или пароль',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }

  async newHashPassword(
    user: UserEntity,
    newPassword: string,
    currentPassword?: string,
  ): Promise<string> {
    if (currentPassword) {
      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentValid) {
        throw new UnauthorizedException('Старый пароль не верный');
      }
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      throw new HttpException(
        'Пароль не должен совпадать с предыдущим',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.hashPassword(newPassword);
  }
}

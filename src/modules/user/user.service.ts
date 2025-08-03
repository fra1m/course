import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
// import * as uuid from 'uuid';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { UserEntity } from './entities/user.entity';
// import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { AuthUserDto } from '../auth/dto/authUser.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private authService: AuthService,
    // private configService: ConfigService,
  ) {}

  private async validateNewUser(email: string) {
    const candidate = await this.getUserByEmail(email);

    if (candidate) {
      throw new HttpException(
        'Пользователь с таким email существует!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserByEmail(email: string) {
    if (!email) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { email },
    });
    return user;
  }

  async getUserById(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException(
        'Пользователь не найден!',
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  async getUserByToken(token: string) {
    const token$ = await this.authService.findToken(token);
    if (!token$) {
      throw new HttpException('Возникла ошибка сервера', HttpStatus.NOT_FOUND);
    }
    const user = await this.userRepository.findOne({
      where: { id: token$.userId.id },
    });

    return user;
  }

  async registrationUser(createUserDto: CreateUserDto) {
    await this.validateNewUser(createUserDto.email);

    createUserDto.password = await this.authService.hashPassword(
      createUserDto.password,
    );

    const user$ = await this.userRepository.save(createUserDto);
    const { password: _, ...user } = user$;

    const tokens = await this.authService.generateToken(user$);
    await this.authService.saveToken(user$, tokens.refreshToken);

    return { user, tokens };
  }

  async authUser(authUserDto: AuthUserDto) {
    const candidate = await this.getUserByEmail(authUserDto.email);

    if (!candidate) {
      throw new HttpException(
        'Пользователь с таким email не существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.authService.auth(authUserDto, candidate);

    const tokens = await this.authService.generateToken(candidate);
    await this.authService.saveToken(user, tokens.refreshToken);

    return { user, tokens };
  }

  async logout(refreshToken: string) {
    const token = await this.authService.removeToken(refreshToken);

    return token;
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException(
        'Вам необходимо заново авторизоваться',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userData = await this.authService.validateRefreshToken(refreshToken);
    const tokenFromDb = await this.authService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw new HttpException(
        'Пользователь не авторизован',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userData.id },
    });

    if (!user) {
      throw new HttpException(
        'Пользователь не существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tokens = await this.authService.generateToken(user);
    await this.authService.saveToken(user, tokens.refreshToken);

    return { user, tokens };
  }

  async validateUser(email: string) {
    const user = await this.getUserByEmail(email);
    console.log('email: ', email, 'user: ', user);
    if (!user) {
      throw new HttpException(
        'Пользователь с таким email не существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    return user;
  }

  async updateUser(updateUserDto: UpdateUserDto) {
    const user = await this.validateUser(updateUserDto.email);

    const newPassword = await this.authService.newHashPassword(
      user,
      updateUserDto.newPassword,
      updateUserDto.password,
    );

    user.password = newPassword;
    await this.userRepository.save(user);

    return newPassword ? true : false;
  }

  async resetUserPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.validateUser(resetPasswordDto.email);

    const newPassword = await this.authService.newHashPassword(
      user,
      resetPasswordDto.newPassword,
    );

    user.password = newPassword;
    await this.userRepository.save(user);

    return newPassword ? true : false;
  }
}

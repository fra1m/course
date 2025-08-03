import { Response } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  Res,
  // Param,
  // UseInterceptors,
  // HttpException,
  Patch,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  // ApiBadRequestResponse,
  // ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  ApiOperation,
  // ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { handleError } from 'src/utils/handleError';
import { CreateUserDto } from './dto/createUser.dto';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { Cookies } from 'src/decorators/cookie.decorator';
import { AuthUserDto } from '../auth/dto/authUser.dto';
import { TokenEntity } from '../auth/entities/token.entity';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('User CRUD')
// @UseInterceptors(LoggingInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Cоздание пользователя', operationId: '1' })
  @ApiExtraModels(UserEntity, TokenEntity, CreateUserDto)
  // @ApiResponse({
  //   status: 200,
  //   type: RegistrationResponseSchema,
  //   description: 'Registration user',
  // })
  // @ApiBadRequestResponse({
  //   type: RegistrationErrorSchema,
  //   description: 'Некорректный запрос',
  // })
  // @ApiBody({ type: RegistrationBodySchema })
  @Post('/registration')
  async registrationUser(@Body() userDto: CreateUserDto, @Res() res: Response) {
    try {
      const payload = await this.userService.registrationUser(userDto);
      res.cookie('refreshToken', payload.tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'strict',
      });
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Congratulations, you can study', ...payload });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @ApiOperation({ summary: 'Авторизация пользователя' })
  @ApiExtraModels(UserEntity, TokenEntity, CreateUserDto)
  // @ApiResponse({ status: 200, type: AuthResponseSchema })
  // @ApiBody({ type: AuthBodySchema })
  @Post('/auth')
  async authUser(@Body() userDto: AuthUserDto, @Res() res: Response) {
    try {
      Logger.debug('auth');

      const payload = await this.userService.authUser(userDto);
      res.cookie('refreshToken', payload.tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Congratulations, you can study', ...payload });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Выход из аккаунта' })
  // @ApiResponse({ status: 200, type: LogoutResponseSchema })
  @Post('/logout')
  async logout(@Cookies('refreshToken') token: string, @Res() res: Response) {
    try {
      if (!token) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'Вы не авторизованы' });
      }
      await this.userService.logout(token);
      return res
        .status(HttpStatus.OK)
        .clearCookie('refreshToken')
        .json({ message: 'Вы вышли из аккаунта' });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Обновление refreshToken в cookies' })
  // @ApiResponse({ status: 200, type: RefreshTokenResponseSchema })
  @Get('/refresh')
  async refresh(@Cookies('refreshToken') token: string, @Res() res: Response) {
    try {
      Logger.debug('refresh-token', token);

      const payload = await this.userService.refresh(token);
      res.cookie('refreshToken', payload.tokens.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      return res
        .status(HttpStatus.OK)
        .json({ message: 'Congratulations, you can study', ...payload });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Смена пароля' })
  // @ApiResponse({ status: 200, type: updateUserResponseSchema })
  @Patch('/patch')
  async userPatch(@Body() updateUserDto: UpdateUserDto, @Res() res: Response) {
    try {
      const payload = await this.userService.updateUser(updateUserDto);

      if (payload === false) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json('Произошла ошибка попробуйте снова');
      }

      return res
        .status(HttpStatus.OK)
        .clearCookie('refreshToken')
        .json({ message: 'Пароль успешно изменён' });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Смена пароля' })
  // @ApiResponse({ status: 200, type: resetUserPasswordResponseSchema })
  @Patch('/reset')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() res: Response,
  ) {
    try {
      const payload =
        await this.userService.resetUserPassword(resetPasswordDto);

      if (payload === false) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json('Произошла ошибка попробуйте снова');
      }

      return res
        .status(HttpStatus.OK)
        .clearCookie('refreshToken')
        .json({ message: 'Пароль успешно сброшен' });
    } catch (error) {
      return handleError(res, error);
    }
  }
  //TODO : delete(user), patch(email)
}

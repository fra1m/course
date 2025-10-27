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
  Delete,
  Param,
  ParseIntPipe,
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
import { Role, UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/updateUser.dto';
import { Cookies } from 'src/decorators/cookie.decorator';
import { AuthUserDto } from '../auth/dto/authUser.dto';
import { TokenEntity } from '../auth/entities/token.entity';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.quard';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { DeleteUserDto } from './dto/deleteUser.dto';
import { User } from 'src/decorators/user.decorator';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@ApiTags('User CRUD')
// @UseInterceptors(LoggingInterceptor)
@Controller(Role.USER)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
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
    Logger.debug('reg', userDto);

    try {
      const payload = await this.userService.registrationUser(userDto);
      Logger.debug('reg', payload);

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
        sameSite: 'lax',
        secure: false, // локально БЕЗ https должно быть false
        path: '/', // чтобы /user/refresh видел куку
      });
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Congratulations, you can study', ...payload });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Получение всех пользователей', operationId: '1' })
  @ApiExtraModels(UserEntity, TokenEntity, CreateUserDto)
  @Get('/all')
  async getAllUsers(@User() user: JwtPayload, @Res() res: Response) {
    try {
      const payload = await this.userService.getAllUsers(user);
      Logger.debug('all', payload);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  // @ApiOperation({ summary: 'Удаление пользователя (АДМИН)', operationId: '1' })
  @ApiExtraModels(UserEntity, TokenEntity, CreateUserDto)
  @Delete('/delete')
  async deleteUser(@Body() dto: DeleteUserDto, @Res() res: Response) {
    try {
      const payload = await this.userService.deleteUserById(dto);
      Logger.debug('delete', payload);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.STUDENT, Role.TEACHER, Role.ADMIN) // @ApiOperation({ summary: 'Удаление пользователя (АДМИН)', operationId: '1' })
  @ApiExtraModels(UserEntity, TokenEntity, CreateUserDto)
  @Get('/me/stats')
  async getUserStats(@User() user: JwtPayload, @Res() res: Response) {
    try {
      const payload = await this.userService.getUserStatsById(user.id);
      Logger.debug('/me/stats', payload);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Смена пароля / верификация пользователя' })
  @Roles(Role.USER, Role.ADMIN)
  @Patch('/patch')
  async userChangePassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const payload = await this.userService.changePasswordUser(
        resetPasswordDto,
        user,
      );

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Обновление данных пользователя' })
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @Patch(':id')
  async userPatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const payload = await this.userService.updateUser(
        updateUserDto,
        user,
        id,
      );

      return res
        .status(HttpStatus.OK)
        .clearCookie('refreshToken')
        .json({ message: 'Пароль успешно изменён', ...payload });
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
        sameSite: 'lax',
        secure: false, // локально БЕЗ https должно быть false
        path: '/', // чтобы /user/refresh видел куку
      });

      return res
        .status(HttpStatus.OK)
        .json({ message: 'Congratulations, you can study', ...payload });
    } catch (error) {
      return handleError(res, error);
    }
  }
}

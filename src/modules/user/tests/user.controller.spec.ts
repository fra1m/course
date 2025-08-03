import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { CreateUserDto } from '../dto/createUser.dto';
import { ResetPasswordDto } from '../dto/resetPassword.dto';
// import { Role } from '../entities/user.entity';

const mockUserService: Partial<Record<keyof UserService, jest.Mock>> = {
  registrationUser: jest.fn(),
  authUser: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
  updateUser: jest.fn(),
  resetUserPassword: jest.fn(),
};

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('UserController', () => {
  let controller: UserController;
  let response: Partial<Response>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    response = mockResponse();
    jest.clearAllMocks();
  });

  describe('registrationUser', () => {
    it('успешно регистрирует пользователя и устанавливает куки', async () => {
      const userDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        // role: Role.USER,
      };

      const mockPayload = {
        user: { id: 1, ...userDto },
        tokens: { accessToken: 'access', refreshToken: 'refresh' },
      };

      mockUserService.registrationUser?.mockResolvedValue(mockPayload);

      await controller.registrationUser(userDto, response as Response);

      expect(mockUserService.registrationUser).toHaveBeenCalledWith(userDto);
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh',
        expect.objectContaining({
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: 'strict',
        }),
      );
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Congratulations, you can study',
        ...mockPayload,
      });
    });

    it('обрабатывает ошибки при регистрации', async () => {
      const userDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        // role: Role.USER,
      };

      const error = new HttpException(
        'Registration failed',
        HttpStatus.BAD_REQUEST,
      );
      mockUserService.registrationUser?.mockRejectedValue(error);

      await controller.registrationUser(userDto, response as Response);

      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Registration failed',
      });
    });
  });

  describe('logout', () => {
    it('успешно выходит из системы с валидным токеном', async () => {
      const token = 'valid-refresh-token';
      mockUserService.logout?.mockResolvedValue(undefined);

      await controller.logout(token, response as Response);

      expect(mockUserService.logout).toHaveBeenCalledWith(token);
      expect(response.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Вы вышли из аккаунта',
      });
    });

    it('возвращает 401 при отсутствии токена', async () => {
      await controller.logout(
        undefined as unknown as string,
        response as Response,
      );

      expect(mockUserService.logout).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Вы не авторизованы',
      });
    });
  });

  describe('resetPassword', () => {
    it('сбрасывает пароль успешно', async () => {
      const resetDto: ResetPasswordDto = {
        email: 'test@example.com',
        newPassword: 'newPass123',
      };

      mockUserService.resetUserPassword?.mockResolvedValue(true);

      await controller.resetPassword(resetDto, response as Response);

      expect(mockUserService.resetUserPassword).toHaveBeenCalledWith(resetDto);
      expect(response.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.json).toHaveBeenCalledWith({
        message: 'Пароль успешно сброшен',
      });
    });

    it('обрабатывает ошибку сброса пароля', async () => {
      const resetDto: ResetPasswordDto = {
        email: 'test@example.com',
        newPassword: 'newPass123',
      };

      mockUserService.resetUserPassword?.mockResolvedValue(false);

      await controller.resetPassword(resetDto, response as Response);

      expect(mockUserService.resetUserPassword).toHaveBeenCalledWith(resetDto);
      expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(response.json).toHaveBeenCalledWith(
        'Произошла ошибка попробуйте снова',
      );
    });
  });
});

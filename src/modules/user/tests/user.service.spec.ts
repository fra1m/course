import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from 'src/modules/auth/auth.service';
import { CreateUserDto } from '../dto/createUser.dto';
import { UserEntity } from '../entities/user.entity';
import { UserService } from '../user.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const userRepositoryMock: Partial<jest.Mocked<Repository<UserEntity>>> = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const authServiceMock: Partial<jest.Mocked<AuthService>> = {
      hashPassword: jest.fn(),
      generateToken: jest.fn(),
      saveToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepositoryMock,
        },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    authService = module.get(AuthService);
  });

  describe('RegistrationUser', () => {
    it('успешно регистрирует нового пользователя', async () => {
      const dto: CreateUserDto = {
        email: 'test@mail.com',
        name: 'Vasya',
        password: '12345',
        // role: Role.USER,
      };

      userRepository.findOne.mockResolvedValue(null);
      authService.hashPassword.mockResolvedValue('hashed-password');
      userRepository.save.mockResolvedValue({
        id: 1,
        ...dto,
        email: dto.email,
        name: dto.name,
        password: 'hashed-password',
      } as UserEntity);

      authService.generateToken.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      authService.saveToken.mockResolvedValue({} as any);

      const result = await service.registrationUser(dto);

      expect(result).toEqual({
        user: {
          id: 1,
          email: dto.email,
          name: dto.name,
          // role: dto.role,
        },
        tokens: {
          accessToken: 'access',
          refreshToken: 'refresh',
        },
      });
    });
  });

  // describe('AuthUser', () => {
  //   it('should auth user and return tokens', async () => {
  //     const dto = {
  //       email: 'test@example.com',
  //       password: 'password',
  //     };

  //     const user: UserEntity = {
  //       id: 1,
  //       email: dto.email,
  //       name: 'Test User',
  //       password: 'hashed-password',
  //       role: Role.User,
  //       token: [],
  //       enrolledCourses: [],
  //       authoredCourses: [],
  //     } as UserEntity;

  //     userRepository.findOne.mockResolvedValue(user);
  //     authService.auth.mockResolvedValue(user);
  //     authService.generateToken.mockResolvedValue({
  //       accessToken: 'access-token',
  //       refreshToken: 'refresh-token',
  //     });
  //     authService.saveToken.mockResolvedValue({} as TokenEntity);

  //     const result = await service.authUser(dto);
  //     expect(result.tokens.accessToken).toBe('access-token');
  //     expect(result.tokens.refreshToken).toBe('refresh-token');
  //     expect(result.user.email).toBe(dto.email);
  //   });
  // })
  // Добавим другие тесты по аналогии — authUser, resetUserPassword, logout и refresh при необходимости.
});

import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// import * as uuid from 'uuid';
import { EntityManager, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Role, UserEntity } from './entities/user.entity';
// import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { AuthUserDto } from '../auth/dto/authUser.dto';
import { DeleteUserDto } from './dto/deleteUser.dto';
import { UserListItemDto } from './dto/userListItem.dto';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';
import { UserStatsEntity } from './entities/user-stats.entity';
import { SpecializationService } from '../specialization/specialization.service';
import { NotificationsGateway } from '../realtime/notifications.gateway';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UserStatsEntity)
    private useruserStatsRepositorysitory: Repository<UserStatsEntity>,

    private specializationService: SpecializationService,
    private authService: AuthService,
    private readonly notifications: NotificationsGateway,

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
  private toListItem(u: UserEntity) {
    // Форма, совместимая с IUserListItem на фронте (без пароля)
    const { id, email, name, role } = u;
    return { id, email, name, role } as const;
  }

  async getAllUsers(user: JwtPayload): Promise<UserListItemDto[]> {
    // Если у password стоит select:false — переключитесь на QB и .addSelect('u.password')
    const users = await this.userRepository.find({
      select: ['id', 'name', 'role', 'email', 'password', 'stats', 'token'],
      relations: ['stats', 'token', 'specialization'],
      order: { id: 'ASC' },
    });

    return users.map<UserListItemDto>((u) => {
      // email админам показываем ТОЛЬКО если это сам запрашивающий админ
      const emailForRole =
        u.role === Role.ADMIN && u.id !== user.id ? '' : u.email;

      // пароль отдаём только для role=user (и это будет хэш, если храните хэш)
      if (u.role === Role.USER) {
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          email: emailForRole,
          password: u.password,
          stats: u.stats || null,
          specialization: u.specialization,
        };
      }

      // для остальных ролей — без пароля
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        email: emailForRole,
        stats: u.stats || null,
        specialization: u.specialization,
      };
    });
  }

  async deleteUserById(dto: DeleteUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.id },
      relations: [
        'enrolledCourses',
        'authoredCourses',
        'quizzes',
        'token',
        'stats',
      ],
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    await this.userRepository.manager.transaction(async (em: EntityManager) => {
      // 1) Чистим M2M user_courses через .remove([...ids])
      const enrolledIds = (user.enrolledCourses ?? []).map((c) => c.id);
      if (enrolledIds.length > 0) {
        await em
          .createQueryBuilder()
          .relation(UserEntity, 'enrolledCourses')
          .of(user.id) // владелец связи
          .remove(enrolledIds); // удаляем связи с этими курсами
      }

      // 2) (Опционально) если в CourseEntity у поля teacher НЕ стоит onDelete: 'SET NULL' / CASCADE,
      //    и БД не даст удалить пользователя из-за FK — тогда обнуляем teacher:
      // await em.getRepository(CourseEntity).update(
      //   { teacher: { id: user.id } },
      //   { teacher: null },
      // );

      // 3) Удаляем пользователя. Если на TokenEntity/QuizEntity стоят onDelete: 'CASCADE',
      //    БД сама удалит связанные записи; иначе добавьте явные delete().
      await em.delete(UserEntity, user.id);
    });

    return { message: `Пользователь с ID ${dto.id} удалён.` };
  }

  async getUserByEmail(email: string) {
    if (!email) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['stats', 'specialization'],
    });

    return user;
  }

  async getUserStatsById(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['stats'],
    });

    if (!user) {
      throw new HttpException(
        'Пользователь не найден!',
        HttpStatus.BAD_REQUEST,
      );
    }
    return user.stats;
  }

  async getUserById(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['stats', 'specialization'],
    });

    console.log(user);

    if (!user) {
      throw new HttpException(
        'Пользователь не найден!',
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  isUser(user: UserEntity) {
    return user.role === Role.USER ? user : null;
  }

  async registrationUser(createUserDto: CreateUserDto) {
    await this.validateNewUser(createUserDto.email);

    if (createUserDto.role !== Role.USER) {
      createUserDto.password = await this.authService.hashPassword(
        createUserDto.password, // всё по дефолту = 0/null
      );
    }

    const user$ = await this.userRepository.save({
      ...createUserDto,
      stats: this.useruserStatsRepositorysitory.create({}), // всё по дефолту = 0/null
    });

    const { password: _, ...user } = user$;

    const tokens = await this.authService.generateToken(user$);
    await this.authService.saveToken(user$, tokens.refreshToken);

    return { user };
  }

  async authUser(authUserDto: AuthUserDto) {
    const candidate = await this.getUserByEmail(authUserDto.email);

    if (!candidate) {
      throw new HttpException(
        'Пользователь с таким email не существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user =
      this.isUser(candidate) ??
      (await this.authService.auth(authUserDto, candidate));

    const tokens = await this.authService.generateToken(candidate);
    await this.authService.saveToken(user ?? candidate, tokens.refreshToken);

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

    const user = await this.getUserById(userData.id);

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

  async changePasswordUser(
    updateUserDto: ResetPasswordDto,
    userJwtf: JwtPayload,
  ) {
    const user = await this.getUserByEmail(userJwtf.email);

    if (!user) throw new NotFoundException('Пользователь не найден');

    const newPassword = await this.authService.newHashPassword(
      user,
      updateUserDto.newPassword,
      updateUserDto.currentPassword,
    );

    user.password = newPassword;
    user.role = Role.STUDENT;
    await this.userRepository.save(user);

    return newPassword ? true : false;
  }

  async updateUser(
    updateUserDto: UpdateUserDto,
    userJwtf: JwtPayload,
    userId: number,
  ) {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isAdmin = userJwtf.role === Role.ADMIN;
    const isSelf = userJwtf.id === userId;

    // USER может править только себя
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('Нельзя редактировать другого пользователя');
    }

    // Нечего обновлять? //TODO добавить обновление имени/email и тд
    if (
      updateUserDto.role === undefined &&
      updateUserDto.specializationId === undefined
    ) {
      throw new BadRequestException('Нет полей для обновления');
    }

    // Имя — всем можно править себя, админ — любого
    // if (updateUserDto.name !== undefined) {
    //   const name = updateUserDto.name.trim();
    //   if (name.length < 2 || name.length > 50) {
    //     throw new BadRequestException('Имя: от 2 до 50 символов');
    //   }
    //   user.name = name;
    // }

    // Роль — только админ
    if (updateUserDto.role !== undefined) {
      if (!isAdmin) {
        throw new ForbiddenException('Недостаточно прав для смены роли');
      }
      user.role = updateUserDto.role;
    }

    // Пароль
    // if (updateUserDto.newPassword !== undefined) {
    //   const newPass = updateUserDto.newPassword;

    //   if (!isAdmin || isSelf) {
    //     // Пользователь меняет свой пароль (или админ меняет СЕБЕ) — требуется currentPassword
    //     if (!updateUserDto.currentPassword) {
    //       throw new BadRequestException('Требуется текущий пароль');
    //     }
    //     const ok = await bcrypt.compare(
    //       updateUserDto.currentPassword,
    //       user.password,
    //     );
    //     if (!ok) {
    //       throw new UnauthorizedException('Старый пароль неверный');
    //     }
    //   }
    //   // Нельзя поставить прежний
    //   const same = await bcrypt.compare(newPass, target.password);
    //   if (same) {
    //     throw new BadRequestException(
    //       'Пароль не должен совпадать с предыдущим',
    //     );
    //   }
    //   target.password = await this.hashPassword(newPass);
    // }

    const prevSpecId = user.specialization?.id ?? null;

    if (updateUserDto.specializationId !== undefined) {
      if (!isAdmin)
        throw new ForbiddenException(
          'Недостаточно прав для смены специализации',
        );

      const spec = await this.specializationService.findSpecById(
        updateUserDto.specializationId,
      );
      if (!spec) throw new BadRequestException('Специализация не найдена');
      user.specialization = spec;
    }

    await this.userRepository.save(user);

    const newSpecId = user.specialization?.id ?? null;
    if (prevSpecId !== newSpecId) {
      this.notifications.notifyUserSpecializationChanged(user.id, newSpecId);
    }

    return this.toListItem(user);
  }

  /**
   * Обновить агрегаты статистики пользователя (upsert).
   * averageScore — число 0..100 (мы храним как numeric -> string).
   */
  async applyQuizStats(
    user: UserEntity,
    patch: {
      quizzesTotal: number;
      quizzesPassed: number;
      averageScore: number;
      lessonsTotal: number;
      lessonsCompleted: number;
      lastActiveAt?: Date;
    },
  ) {
    const stats = await this.getUserStatsById(user.id);

    if (!stats) {
      user.stats = this.useruserStatsRepositorysitory.create({});
    }

    stats.quizzesTotal = patch.quizzesTotal;
    stats.quizzesPassed = patch.quizzesPassed;
    stats.lessonsTotal = patch.lessonsTotal;
    stats.lessonsCompleted = patch.lessonsCompleted;

    const avg = Math.min(100, Math.max(0, Number(patch.averageScore) || 0));
    stats.averageScore = String(Math.round(avg * 100) / 100);

    if (patch.lastActiveAt) stats.lastActiveAt = patch.lastActiveAt;

    const stats$ = await this.useruserStatsRepositorysitory.save(stats);

    return {
      quizzesTotal: stats$.quizzesTotal,
      quizzesPassed: stats$.quizzesPassed,
      averageScore: Number(stats$.averageScore),
      coursesEnrolled: stats$.coursesEnrolled,
      coursesAuthored: stats$.coursesAuthored,
      lessonsTotal: stats$.lessonsTotal,
      lessonsCompleted: stats$.lessonsCompleted,
      streakDays: stats$.streakDays,
      lastActiveAt: stats$.lastActiveAt?.toISOString() ?? null,
    };
  }
}

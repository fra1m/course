import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';

import { CourseEntity } from './entities/course.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';
import { UpdateCourseDto } from './dto/update-course.dto';
import { DeleteCourseDto } from './dto/delete-course.dto';
import { resolve } from 'path';
import { promises as fs } from 'node:fs';
import { Role } from '../user/entities/user.entity';
import { SpecializationService } from '../specialization/specialization.service';
import { SpecializationEntity } from '../specialization/entities/specialization.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
    private userService: UserService,
    private specializationService: SpecializationService,
  ) {}
  private readonly logger = new Logger(CoursesService.name);

  private get uploadBase() {
    return resolve(process.env.UPLOAD_DIR ?? '/app/uploads/courses');
  }

  private normalizeAndGuard(absFromDb: string): string {
    const abs = resolve(absFromDb);
    const base = this.uploadBase;
    if (!abs.startsWith(base)) {
      // не удаляем ничего вне каталога загрузок
      throw new Error(
        `Refusing to delete outside upload dir: ${abs} (base ${base})`,
      );
    }
    return abs;
  }

  private mapCourse(c: CourseEntity) {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      teacherId: c.teacher?.id ?? null,
      filePath: c.filePath,
      specialization: c.specialization
        ? {
            id: c.specialization.id,
            slug: c.specialization.slug,
            title: c.specialization.title,
          }
        : null,
    };
  }

  async getCourseFilePathById(id: number): Promise<string> {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course || !course.filePath) {
      throw new HttpException('Курс не существует', HttpStatus.BAD_REQUEST);
    }

    return process.cwd() + `/${course.filePath}`;
  }

  async getCourseById(id: number) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher', 'specialization'],
    });
    if (!course) {
      throw new HttpException('Курс не существует', HttpStatus.BAD_REQUEST);
    }

    return course;
  }

  async countQuizzesBySpecialization(specId: number): Promise<number> {
    return this.courseRepository
      .createQueryBuilder('q')
      .innerJoin('q.specialization', 's', 's.id = :specId', { specId })
      .getCount();
  }

  async createCours(
    dto: CreateCourseDto,
    userPayload: JwtPayload,
    filePath: string,
  ) {
    const user = await this.userService.getUserById(userPayload.id);

    let specialization: SpecializationEntity | null = null;
    if (dto.specializationId !== undefined) {
      const specId = dto.specializationId;
      if (!Number.isFinite(specId) || specId <= 0) {
        throw new BadRequestException('Некорректный specializationId');
      }
      specialization =
        (await this.specializationService.findSpecById(specId)) ?? null;
      if (!specialization) {
        throw new BadRequestException('Специализация не найдена');
      }
    }

    const course = await this.courseRepository.save({
      ...dto,
      teacher: user,
      filePath,
      specialization: specialization ?? null,
    });

    return this.mapCourse(course);
  }

  async getAllCoursesByTeacherId(userPayload: JwtPayload) {
    const isTeacher = userPayload.role === Role.TEACHER;
    if (!isTeacher) {
      throw new ForbiddenException('Недостаточно прав');
    }
    const list = await this.courseRepository.find({
      where: { teacher: { id: userPayload.id } },
      relations: ['teacher', 'specialization'],
      order: { id: 'DESC' },
    });
    return list.map((c) => this.mapCourse(c));
  }

  async listByUserSpecialization(userPayload: JwtPayload) {
    const specId = userPayload.specializationId ?? null;
    if (!specId) return;

    const list = await this.courseRepository.find({
      where: { specialization: { id: specId } },
      relations: ['teacher', 'specialization'],
      order: { id: 'DESC' },
    });
    return list.map((c) => this.mapCourse(c));
  }

  async listAllAdmin(
    userPayload: JwtPayload,
    opts?: { specializationId?: number },
  ) {
    const isAdmin = userPayload.role === Role.ADMIN;
    if (!isAdmin) {
      throw new ForbiddenException('Недостаточно прав');
    }

    const where =
      opts?.specializationId && Number.isFinite(opts.specializationId)
        ? { specialization: { id: Number(opts.specializationId) } }
        : {};
    const list = await this.courseRepository.find({
      where,
      relations: ['teacher', 'specialization'],
      order: { id: 'DESC' },
    });
    return list.map((c) => this.mapCourse(c));
  }

  async listForUser(user: JwtPayload, opts?: { specializationId?: number }) {
    if (user.role === Role.STUDENT) {
      return await this.listByUserSpecialization(user);
    }
    if (user.role === Role.TEACHER) {
      return await this.getAllCoursesByTeacherId(user);
    }
    // admin
    return this.listAllAdmin(user, {
      specializationId: opts?.specializationId,
    });
  }

  async updateCours(dto: UpdateCourseDto, userPayload: JwtPayload) {
    const course = await this.getCourseById(dto.id);

    const isOwner = course.teacher?.id === userPayload.id;
    const isAdmin = userPayload.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Вы не можете редактировать этот курс');
    }

    if (dto.title !== undefined) course.title = dto.title;
    if (dto.description !== undefined) course.description = dto.description;

    // разрешим администратору менять специализацию курса
    if (dto.specializationId !== undefined) {
      if (!isAdmin) {
        throw new ForbiddenException(
          'Недостаточно прав для смены специализации курса',
        );
      }
      const specId = dto.specializationId;
      if (!Number.isFinite(specId) || specId <= 0) {
        throw new BadRequestException('Некорректный айди специальности');
      }
      const spec =
        (await this.specializationService.findSpecById(specId)) ?? null;
      if (!spec) throw new BadRequestException('Специализация не найдена');
      course.specialization = spec;
    }

    const updated = await this.courseRepository.save(course);
    return this.mapCourse(updated);
  }

  async deleteCourse(dto: DeleteCourseDto, userPayload: JwtPayload) {
    const isAdmin = userPayload.role === Role.ADMIN;

    const course = await this.courseRepository.findOne({
      where: isAdmin
        ? { id: dto.id }
        : { id: dto.id, teacher: { id: userPayload.id } },
      relations: ['teacher', 'students', 'lessons', 'lessons.quizId'],
    });

    if (!course) {
      throw new NotFoundException(`Курс не найден у пользователя`);
    }

    const absPath = course.filePath
      ? this.normalizeAndGuard(course.filePath)
      : null;

    if (absPath === null) {
      throw new HttpException(
        'Внутренняя ошибка сервера',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1) удаляем курс в БД
    await this.courseRepository.remove(course);

    // 2) пробуем удалить файл; ошибка удаления не роняет запрос
    if (absPath) {
      try {
        await fs.unlink(absPath);
        this.logger.log(`Удалён файл курса: ${absPath}`);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException)?.code;
        if (code === 'ENOENT') {
          this.logger.warn(`Файл уже отсутствует: ${absPath}`);
        } else {
          this.logger.warn(
            `Не удалось удалить файл "${absPath}": ${String(err)}`,
          );
        }
      }
    }

    return { id: dto.id };
  }
}

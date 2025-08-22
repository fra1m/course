import {
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

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepository: Repository<CourseEntity>,
    private userService: UserService,
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
      relations: ['teacher'],
    });
    if (!course) {
      throw new HttpException('Курс не существует', HttpStatus.BAD_REQUEST);
    }

    return course;
  }

  async createCours(
    dto: CreateCourseDto,
    userPayload: JwtPayload,
    filePath: string,
  ) {
    const user = await this.userService.getUserById(userPayload.id);

    const course = await this.courseRepository.save({
      ...dto,
      teacher: user,
      filePath,
    });
    // Возвращаем «плоский» объект без teacher
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      teacherId: user.id,
      filePath: course.filePath,
    };
  }

  async getAllCoursesByTeacherId(userPayload: JwtPayload) {
    const courses = await this.courseRepository
      .createQueryBuilder('c')
      .addSelect('c.id', 'id')
      .addSelect('c.title', 'title')
      .addSelect('c.description', 'description')
      .addSelect('c.teacherId', 'teacherId')
      .where('c.teacherId = :tid', { tid: userPayload.id })
      .orderBy('c.id', 'DESC')
      .getRawMany<{
        id: number;
        title: string;
        description: string;
        teacherId: number;
      }>();

    return courses;
  }

  async updateCours(dto: UpdateCourseDto, userPayload: JwtPayload) {
    const course = await this.getCourseById(dto.id);

    if (!course || course.teacher.id !== userPayload.id) {
      throw new HttpException(
        'Вы не можете редактировать эот курс',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.description) course.description = dto.description;
    if (dto.title) course.title = dto.title;

    const updatedCourse = await this.courseRepository.save(course);

    return {
      id: updatedCourse.id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      teacherId: userPayload.id,
      filePath: updatedCourse.filePath,
    };
  }

  async deleteCourse(dto: DeleteCourseDto, userPayload: JwtPayload) {
    const course = await this.courseRepository.findOne({
      where: {
        id: dto.id,
        teacher: { id: userPayload.id },
      },
      relations: [
        'teacher',
        'students',
        'students',
        'lessons',
        'lessons.quizId',
      ],
    });

    console.dir(course, { depth: null });

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

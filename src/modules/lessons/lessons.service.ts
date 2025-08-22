import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as fs from 'fs';
import { LessonEntity } from './entities/lesson.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PDFDocument } from 'pdf-lib';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { QuizService } from '../quiz/quiz.service';
import { ConfigService } from '@nestjs/config';
import { CoursesService } from '../courses/courses.service';
import { readFile } from 'fs/promises';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonRepository: Repository<LessonEntity>,
    private quizService: QuizService,
    private coursesService: CoursesService,
    private configService: ConfigService,
  ) {}

  /**
   * Извлекает страницы из PDF-файла (нумерация с 1!).
   * @param body Дто для создания
   * @returns Buffer PDF с нужными страницами
   */
  async saveLesson(body: CreateLessonDto) {
    const course = await this.coursesService.getCourseById(body.courseId);

    const filePath = course.filePath;

    console.dir(filePath, { depth: null });
    const quiz = await this.quizService.findQuizByID(body.quizId ?? 0);

    const lesson = await this.lessonRepository.save({
      title: body.title,
      filePath,
      pages: body.pages,
      quizId: quiz ?? undefined,
      courseId: course, //TODO: переименовать в courseId
    });

    return lesson;
  }
  async streamLesson(id: number) {
    const lesson = await this.getLessonById(id);

    const filePath = lesson.filePath;

    const bytes = await readFile(filePath);
    const src = await PDFDocument.load(bytes);

    const pageCount = src.getPageCount();
    if (lesson.pages.end > pageCount) {
      throw new BadRequestException(`from > total pages (${pageCount})`);
    }

    const start = Math.max(1, Math.min(lesson.pages.startWith, pageCount));
    const end = Math.max(start, Math.min(lesson.pages.end, pageCount));

    const dst = await PDFDocument.create();
    const indices: number[] = [];
    for (let i = start - 1; i < end; i += 1) indices.push(i);

    const copied = await dst.copyPages(src, indices);
    copied.forEach((p) => dst.addPage(p));

    const out = await dst.save(); // Uint8Array

    return Buffer.from(out);
  }

  async getAllLessonsLite() {
    return this.lessonRepository.find({
      relations: { quizId: true, courseId: true },
      select: { id: true, title: true, pages: true },
      order: { id: 'ASC' },
    });
  }

  async getLessonById(id: number) {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) {
      throw new HttpException('Урок не существует', HttpStatus.BAD_REQUEST);
    }
    return lesson;
  }
}

import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { LessonEntity } from './entities/lesson.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PDFDocument } from 'pdf-lib';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { QuizService } from '../quiz/quiz.service';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonRepository: Repository<LessonEntity>,
    private quizService: QuizService,
    // private configService: ConfigService,
  ) {}

  async parseDocxToHtml(
    filePath: string,
    startWith = 5,
    end = 16,
  ): Promise<string> {
    const buffer = fs.readFileSync(filePath);

    const { value: html } = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Normal'] => p:fresh",
          'b => strong',
          'i => em',
        ],
      },
    );

    // Готовим универсальную регулярку по маркеру страницы
    const pagePattern = /<p>\s*(\d{1,3} ЛБИЮ\.00367-01 34 01)\s*<\/p>/g;

    // Находим все индексы начала страниц
    let match: RegExpExecArray | null;
    const indices: number[] = [];
    while ((match = pagePattern.exec(html)) !== null) {
      indices.push(match.index);
    }
    // Если ничего не нашли — значит маркеры другие, надо проверить html!
    if (indices.length === 0) {
      // Попробуй вывести кусок html для отладки
      console.warn('Маркеры страниц не найдены, проверь разметку!!!!!');
      console.log(html.slice(0, 1500)); // первые 1.5К символов для ручной проверки
      return `<div class="docx-content"></div>`;
    }
    indices.push(html.length); // чтобы корректно резать последний кусок

    // Вырезаем нужные страницы
    const resultParts: string[] = [];
    for (let i = startWith - 1; i < Math.min(end, indices.length - 1); i++) {
      resultParts.push(html.slice(indices[i], indices[i + 1]));
    }
    const resultHtml = resultParts.join('\n');

    return `<div class="docx-content">${resultHtml}</div>`;
  }

  /**
   * Извлекает страницы из PDF-файла (нумерация с 1!).
   * @param filePath Путь к PDF
   * @param body Дто для создания
   * @returns Buffer PDF с нужными страницами
   */
  async extractPdfPages(
    filePath: string,
    body: CreateLessonDto,
  ): Promise<Buffer> {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const newPdfDoc = await PDFDocument.create();

    for (let i = body.pages.startWith - 1; i < body.pages.end; i++) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
    }

    const newPdfBytes = await newPdfDoc.save();

    const quiz = await this.quizService.findQuizByID(body.quizId ?? 0);

    const lesson = Buffer.from(newPdfBytes);
    await this.lessonRepository.save({
      title: body.title,
      content: lesson,
      pages: body.pages,
      quizId: quiz ?? undefined,
    });

    return lesson;
  }

  async getAllLessonsLite() {
    return this.lessonRepository.find({
      relations: { quizId: true },
      select: { id: true, title: true, pages: true },
      order: { id: 'ASC' },
    });
  }

  async getLessonContentById(id: number) {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson || !lesson.content) return null;
    // В PostgreSQL bytea обычно уже Buffer
    return Buffer.isBuffer(lesson.content)
      ? lesson.content
      : Buffer.from(lesson.content as any);
  }
}

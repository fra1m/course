/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Response, Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  Res,
  Query,
  Req,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.quard';

// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Roles('admin') //FIXME: добавить каждому эндпоинту соответствующие роли
  @Post('/genAndGet')
  async findAll(
    @Res() res: Response,
    @Body() body: { startWith: number; end: number },
  ) {
    console.dir('START');
    console.dir(body, { depth: null });
    const payload = await this.lessonsService.parseDocxToHtml(
      process.cwd() + '/src/static/DOC.docx',
      // body.startWith,
      // body.end,
    );
    console.dir('END%' + payload, { depth: null });

    return res.status(HttpStatus.OK).json({ html: payload });
  }

  @Roles('admin')
  @Get('all')
  async getAllLessons(@Req() req: Request) {
    const items = await this.lessonsService.getAllLessonsLite();
    console.dir(items, { depth: null });
    // Базовый origin: лучше хранить в конфиге
    const origin =
      process.env.APP_ORIGIN ?? `${req.protocol}://${req.get('host')}`;

    return items.map((l) =>
      l.quizId
        ? {
            id: l.id,
            title: l.title,
            pages: l.pages,
            testId: l.quizId.id,
            contentUrl: `${origin}/lessons/${l.id}/content`, // ссылка для iframe
          }
        : {
            id: l.id,
            title: l.title,
            pages: l.pages,
            testId: null,
            contentUrl: `${origin}/lessons/${l.id}/content`, // ссылка для iframe
          },
    );
  }

  @Roles('admin')
  @Get(':id/content')
  async streamLessonContent(@Param('id') id: string, @Res() res: Response) {
    const buf = await this.lessonsService.getLessonContentById(+id);
    if (!buf) {
      return res.status(404).send('Lesson not found');
    }
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="lesson_${id}.pdf"`,
      'Cache-Control': 'no-store',
    });
    res.end(buf);
  }

  @Get('extract')
  extractPages(
    @Res() res: Response,
    @Query('start') startPage: string,
    @Query('end') endPage: string,
  ) {
    console.dir(`Start: ${startPage}, End: ${endPage}`, { depth: null });

    // const start = parseInt(startPage) || 6;
    // const end = parseInt(endPage) || 16;
    // const filePath = process.cwd() + '/src/static/DOC.pdf';

    // try {
    //   const pdfBuffer = await this.lessonsService.extractPdfPages(
    //     filePath,
    //     start,
    //     end,
    //   );

    //   console.dir(pdfBuffer, { depth: null });
    //   res.set({
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': `inline; filename=pages_${start}-${end}.pdf`,
    //   });
    //   res.end(pdfBuffer);
    // } catch (e) {
    //   res.status(500).send('Ошибка при извлечении страниц PDF: ' + e.message);
    // }
  }

  @Roles('admin')
  @Post('create')
  async saveLesson(@Res() res: Response, @Body() body: CreateLessonDto) {
    console.dir(`Start: ${body.pages.startWith}, End: ${body.pages.end}`, {
      depth: null,
    });

    console.dir(process.cwd(), { depth: null });

    const filePath = process.cwd() + '/dist/static/DOC.pdf';

    try {
      const pdfBuffer = await this.lessonsService.extractPdfPages(
        filePath,
        body,
      );

      console.dir(pdfBuffer, { depth: null });
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=pages_${body.pages.startWith}-${body.pages.end}.pdf`,
      });
      res.end(pdfBuffer);
    } catch (e) {
      res.status(500).send('Ошибка при извлечении страниц PDF: ' + e.message);
    }
  }
}

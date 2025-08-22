/* eslint-disable @typescript-eslint/no-unused-vars */

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
import { handleError } from 'src/utils/handleError';
import { basename } from 'path';
import { randomInt } from 'crypto';

// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Roles('admin')
  @Post('/create')
  async saveLesson(@Res() res: Response, @Body() body: CreateLessonDto) {
    try {
      const payload = await this.lessonsService.saveLesson(body);

      return res
        .status(HttpStatus.OK)
        .json({ message: 'Congratulations, you can study', ...payload });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles('admin')
  @Get(':id/content')
  async streamLessonContent(@Param('id') id: string, @Res() res: Response) {
    try {
      const buf = await this.lessonsService.streamLesson(+id);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': String(buf.length),
        'Content-Disposition': `inline; filename="${encodeURIComponent(
          `lesson-${id + randomInt(100)}`,
        )}"`,
        'Cache-Control': 'no-store',
      });
      res.end(buf);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles('admin')
  @Get('all')
  async getAllLessons(@Req() req: Request, @Res() res: Response) {
    try {
      const items = await this.lessonsService.getAllLessonsLite();

      const payload = items.map((l) =>
        l.quizId
          ? {
              id: l.id,
              title: l.title,
              pages: l.pages,
              testId: l.quizId.id,
              courseId: l.courseId.id,
            }
          : {
              id: l.id,
              title: l.title,
              pages: l.pages,
              testId: null,
              courseId: l.courseId.id,
            },
      );

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

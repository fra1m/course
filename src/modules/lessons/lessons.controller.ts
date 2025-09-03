import { Response, Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.quard';
import { handleError } from 'src/utils/handleError';
import { randomInt } from 'crypto';
import { Role } from '../user/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Roles(Role.TEACHER, Role.ADMIN)
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

  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
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

  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @Get('all')
  async getAllLessons(@Req() req: Request, @Res() res: Response) {
    try {
      const items = await this.lessonsService.getAllLessonsLite();

      console.log(items);

      const payload = items.map((l) =>
        l.quizId
          ? {
              id: l.id,
              title: l.title,
              pages: l.pages,
              testId: l.quizId,
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

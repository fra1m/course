// FIXME: исправить, чтобы ученики тоже могли иметь возможность получить уроки
import { Response } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';
import { handleError } from 'src/utils/handleError';
import { DeleteQuizDto } from './dto/delete-quiz.dto';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { RolesGuard } from '../auth/roles.quard';
import { Role } from '../user/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Roles(Role.TEACHER, Role.ADMIN)
  @Post('/create')
  async createQuiz(
    @User() user: JwtPayload,
    @Body() dto: CreateQuizDto,
    @Res() res: Response,
  ) {
    try {
      const payload = await this.quizService.saveQuiz(dto, user);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Congratulations, you can study', ...payload });
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('/all')
  async getQuiz(@User() user: JwtPayload, @Res() res: Response) {
    try {
      const payload = await this.quizService.getByQuizUserId(user);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles(Role.TEACHER, Role.ADMIN)
  @Patch('/update')
  async updateQuiz(
    @User() user: JwtPayload,
    @Body() dto: UpdateQuizDto,
    @Res() res: Response,
  ) {
    try {
      const payload = await this.quizService.updateQuize(dto, user);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles(Role.TEACHER, Role.ADMIN)
  @Delete('/delete')
  async deleteQuiz(
    @User() user: JwtPayload,
    @Body() dto: DeleteQuizDto,
    @Res() res: Response,
  ) {
    console.dir('TYT');

    try {
      const payload = await this.quizService.deleteQuiz(dto, user);
      console.dir(payload);
      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

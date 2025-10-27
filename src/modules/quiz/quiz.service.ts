import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizEntity } from './entities/quiz.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';
import { UserService } from '../user/user.service';
import { DeleteQuizDto } from './dto/delete-quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(QuizEntity)
    private quizRepository: Repository<QuizEntity>,
    private userService: UserService,
    // private configService: ConfigService,
  ) {}

  async saveQuiz(createQuizDto: CreateQuizDto, userPayload: JwtPayload) {
    console.log(userPayload.id);

    const user = await this.userService.getUserById(userPayload.id);

    const surveyJson = await this.quizRepository.save({
      ...createQuizDto,
      user,
    });

    return surveyJson;
  }

  async findAll() {
    const quizzes = await this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.user', 'user')
      .select(['quiz.id', 'quiz.surveyJson', 'quiz.createdAt', 'user.id'])
      .getMany();

    return quizzes.map((q) => ({
      surveyJson: q.surveyJson,
      user: { id: q.user.id },
      id: q.id,
      createdAt: q.createdAt,
    }));
  }

  // TODO сделать отдачу квизов для студента, сделать добавлегние студента к списку студентов курса (сейчас у студентов возращается пустой массив кивзов), нужно чтобы квизы (скорее всего уроки) и курсы сохранялись в специализацию, чтобы потом подтягивать все через сущност ьспециализации
  async getByQuizUserId(userPayload: JwtPayload) {
    const quizzes = await this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.user', 'user')
      .where('user.id = :userId', { userId: userPayload.id }) // <-- фильтрация
      .select(['quiz.id', 'quiz.surveyJson', 'quiz.createdAt', 'user.id'])
      .getMany();

    return quizzes.map((q) => ({
      surveyJson: q.surveyJson,
      // user: { id: q.user.id },
      id: q.id,
      // createdAt: q.createdAt,
    }));
  }

  async findQuizByID(id: number) {
    return await this.quizRepository.findOne({
      where: { id },
    });
  }

  async updateQuize(updateQuizDto: UpdateQuizDto, userPayload: JwtPayload) {
    const { id, surveyJson } = updateQuizDto;

    const quiz = await this.quizRepository.findOne({
      where: {
        id,
        user: { id: userPayload.id },
      },
      relations: ['user'],
    });

    if (!quiz) {
      throw new NotFoundException(`Тест не найден у пользователя`);
    }
    if (surveyJson) quiz.surveyJson = surveyJson;

    const updatedQuiz = await this.quizRepository.save(quiz);

    return {
      surveyJson: updatedQuiz.surveyJson,
    };
  }

  async deleteQuiz(deleteQuizDto: DeleteQuizDto, userPayload: JwtPayload) {
    const quiz = await this.quizRepository.findOne({
      where: {
        id: deleteQuizDto.id,
        user: { id: userPayload.id },
      },
      relations: ['user'],
    });

    if (!quiz) {
      throw new NotFoundException(`Тест не найден у пользователя`);
    }

    await this.quizRepository.remove(quiz); // Фактическое удаление

    return { message: `Тест с ID ${deleteQuizDto.id} успешно удалён.` };
  }

  async countQuizzesBySpecialization(specId: number): Promise<number> {
    return this.quizRepository
      .createQueryBuilder('q')
      .innerJoin('q.specialization', 's', 's.id = :specId', { specId })
      .getCount();
  }
}

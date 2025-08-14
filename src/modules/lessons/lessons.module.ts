import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonEntity } from './entities/lesson.entity';
import { AuthModule } from '../auth/auth.module';
import { QuizModule } from '../quiz/quiz.module';

@Module({
  imports: [TypeOrmModule.forFeature([LessonEntity]), AuthModule, QuizModule],
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}

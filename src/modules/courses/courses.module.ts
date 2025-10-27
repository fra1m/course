import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseEntity } from './entities/course.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { QuizModule } from '../quiz/quiz.module';
import { SpecializationModule } from '../specialization/specialization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEntity]),
    AuthModule,
    UserModule,
    QuizModule,
    SpecializationModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}

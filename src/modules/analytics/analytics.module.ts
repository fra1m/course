import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { QuizAttemptEntity } from './entities/quiz-attempt.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { CoursesModule } from '../courses/courses.module';
import { LessonsModule } from '../lessons/lessons.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizAttemptEntity]),
    UserModule,
    AuthModule,
    LessonsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

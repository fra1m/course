import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MediaModule } from './modules/media/media.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { SectionsModule } from './modules/sections/sections.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CoursesModule } from './modules/courses/courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // cache: true,
      isGlobal: true,
      envFilePath: `.env`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        autoLoadEntities: true,
        synchronize: true,
        logging: true,
      }),
    }),
    AnalyticsModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    MediaModule,
    QuizModule,
    SectionsModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

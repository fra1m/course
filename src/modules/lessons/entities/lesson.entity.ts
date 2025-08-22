// src/modules/lesson/entities/lesson.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  JoinColumn,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { QuizEntity } from 'src/modules/quiz/entities/quiz.entity';
import { CourseEntity } from 'src/modules/courses/entities/course.entity';

export class LessonPage {
  @ApiProperty({
    example: 1,
    description: 'Номер страницы, с которой начинается урок',
  })
  @Column({ type: 'int' })
  startWith: number;

  @ApiProperty({
    example: 10,
    description: 'Номер страницы, на которой заканчивается урок',
  })
  @Column({ type: 'int' })
  end: number;
}

@Entity({ name: 'lesson' })
export class LessonEntity extends BaseEntity {
  @ApiProperty({ example: 1, description: 'ID урока' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'Что такое TypeScript?',
    description: 'Название урока',
  })
  @Column()
  title: string;

  @ApiProperty({
    description: 'Путь контента урока',
  })
  @Column({ nullable: false })
  filePath: string;

  @ApiProperty({
    description: 'JSON-страница урока',
    type: LessonPage,
    example: { startWith: 1, end: 10 },
  })
  @Column({ type: 'json', nullable: true })
  pages: LessonPage;

  @ApiProperty({
    example: 1,
    description: 'ID курса, к которому относится урок',
  })
  @OneToOne(() => QuizEntity, (quiz) => quiz.lessonId, {
    // onDelete: 'CASCADE',
    nullable: true,
    // cascade: true,
  })
  @JoinColumn({ name: 'quizId' })
  quizId: QuizEntity;

  // ---- Курс (многие уроки к одному курсу) ----
  @ManyToOne(() => CourseEntity, (course) => course.lessons, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  courseId: CourseEntity;
}

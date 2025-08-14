// src/modules/lesson/entities/lesson.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { SectionEntity } from 'src/modules/sections/entities/section.entity';
import { QuizEntity } from 'src/modules/quiz/entities/quiz.entity';

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
    description: ' контент',
  })
  @Column({ type: 'bytea', nullable: true })
  content: Buffer;

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
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'quizId' })
  quizId: QuizEntity;

  @ManyToOne(() => SectionEntity, (section) => section.lessons, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sectionId' })
  sectionId: SectionEntity;
}

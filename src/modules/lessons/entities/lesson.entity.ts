// src/modules/lesson/entities/lesson.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CourseEntity } from 'src/modules/courses/entities/course.entity';
import { SectionEntity } from 'src/modules/sections/entities/section.entity';

export enum ContentType {
  VIDEO = 'video',
  TEXT = 'text',
  QUIZ = 'quiz',
}

@Entity({ name: 'lessons' })
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
    enum: ContentType,
    example: ContentType.VIDEO,
    description: 'Тип контента',
  })
  @Column({ type: 'enum', enum: ContentType })
  contentType: ContentType;

  @ApiProperty({
    example: 'https://video-host.com/lesson123',
    description: 'Контент (URL или текст)',
  })
  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => CourseEntity, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: CourseEntity;

  @Column()
  courseId: number;

  @ManyToOne(() => SectionEntity, (section) => section.lessons, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sectionId' })
  section: SectionEntity;

  @Column({ nullable: true })
  sectionId: number;
}

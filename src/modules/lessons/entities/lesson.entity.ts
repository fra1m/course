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
    description: 'HTML форма контента',
  })
  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => CourseEntity, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  courseId: CourseEntity;

  @ManyToOne(() => SectionEntity, (section) => section.lessons, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sectionId' })
  sectionId: SectionEntity;
}

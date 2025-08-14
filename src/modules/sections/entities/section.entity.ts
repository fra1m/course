import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CourseEntity } from 'src/modules/courses/entities/course.entity';
import { LessonEntity } from 'src/modules/lessons/entities/lesson.entity';

@Entity({ name: 'sections' }) // или "modules" если нужно строго Module
export class SectionEntity extends BaseEntity {
  @ApiProperty({ example: 1, description: 'ID раздела' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Введение', description: 'Название раздела' })
  @Column()
  title: string;

  @ManyToOne(() => CourseEntity, (course) => course.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  courseId: CourseEntity;

  @OneToMany(() => LessonEntity, (lesson) => lesson.sectionId)
  lessons: LessonEntity[];
}

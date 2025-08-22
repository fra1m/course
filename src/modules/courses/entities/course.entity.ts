import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import { UserEntity } from 'src/modules/user/entities/user.entity';
import { LessonEntity } from 'src/modules/lessons/entities/lesson.entity';

@Entity({ name: 'courses' })
export class CourseEntity extends BaseEntity {
  @ApiProperty({ example: 1, description: 'ID курса' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Основы TypeScript', description: 'Название курса' })
  @Column()
  title: string;

  @ApiProperty({
    example: 'Изучите базовые концепции TypeScript',
    description: 'Описание курса',
  })
  @Column({ type: 'text' })
  description: string;

  // @ApiProperty({ type: () => LessonEntity, isArray: true })
  @OneToMany(() => LessonEntity, (lesson) => lesson.courseId, {
    cascade: ['insert', 'update'],
  })
  lessons: LessonEntity[];

  @ApiProperty({
    type: () => UserEntity,
    description: 'Преподаватель курса',
  })
  @ManyToOne(() => UserEntity, (user) => user.authoredCourses, {
    onDelete: 'SET NULL', // курсы сохранятся, teacher=null
    nullable: true,
  })
  teacher: UserEntity;

  @ApiProperty({
    type: () => UserEntity,
    isArray: true,
    description: 'Список студентов, записанных на курс',
  })
  @ManyToMany(() => UserEntity, (user) => user.enrolledCourses)
  students?: UserEntity[];

  @ApiHideProperty()
  @Column({ nullable: false })
  filePath: string;
}

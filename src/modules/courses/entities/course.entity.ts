import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SectionEntity } from 'src/modules/sections/entities/section.entity';
import { LessonEntity } from 'src/modules/lessons/entities/lesson.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';

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

  @ApiProperty({ example: true, description: 'Опубликован ли курс' })
  @Column({ default: false })
  isPublished: boolean;

  @OneToMany(() => SectionEntity, (section) => section.course, {
    cascade: true,
  })
  sections: SectionEntity[];

  @OneToMany(() => LessonEntity, (lesson) => lesson.course, { cascade: true })
  lessons: LessonEntity[];

  @ManyToOne(() => UserEntity, (user) => user.authoredCourses)
  teacher: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.enrolledCourses)
  students: UserEntity[];
}

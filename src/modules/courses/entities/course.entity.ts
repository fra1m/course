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

  // @ApiProperty({ example: true, description: 'Опубликован ли курс' })
  // @Column({ default: false })
  // isPublished: boolean; //NOTE может не нужен этот параметр

  @ApiProperty({
    type: () => SectionEntity,
    isArray: true,
    description: 'Секции, входящие в курс',
  })
  @OneToMany(() => SectionEntity, (section) => section.courseId, {
    cascade: true,
  })
  sections: SectionEntity[];

  @ApiProperty({
    type: () => UserEntity,
    description: 'Преподаватель курса',
  })
  @ManyToOne(() => UserEntity, (user) => user.authoredCourses)
  teacher: UserEntity;

  @ApiProperty({
    type: () => UserEntity,
    isArray: true,
    description: 'Список студентов, записанных на курс',
  })
  @ManyToMany(() => UserEntity, (user) => user.enrolledCourses)
  students?: UserEntity[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { TokenEntity } from 'src/modules/auth/entities/token.entity';
import { CourseEntity } from 'src/modules/courses/entities/course.entity';
import { QuizEntity } from 'src/modules/quiz/entities/quiz.entity';

export enum Role {
  USER = 'user',
  STUDENT = 'student',
  ADMIN = 'admin',
  TEACHER = 'teacher',
}

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: [TokenEntity],
    description: 'Массив токенов пользователя',
  })
  @OneToMany(() => TokenEntity, (token) => token.userId)
  token: TokenEntity[];

  @ApiProperty({
    example: `user_${Math.random().toString(36).substring(7)}@example.com`,
    description: 'Почта пользователя',
  })
  @Column({ unique: true, nullable: false })
  email: string;

  @ApiProperty({
    example: 'pass123',
    description: 'Пароль пользователя',
    minLength: 6,
    maxLength: 16,
  })
  @Column({ nullable: false })
  password: string;

  @ApiProperty({
    example: 'TestDeveloper',
    description: 'Имя пользователя',
  })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
    description: 'Роль пользователя',
  })
  @Column({ type: 'enum', enum: Role, default: Role.ADMIN })
  role: Role;

  @ApiHideProperty() //TODO: разберись как в свагере отображать
  @ManyToMany(() => CourseEntity, (course) => course.students)
  @JoinTable({
    name: 'user_courses',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'course_id', referencedColumnName: 'id' },
  })
  enrolledCourses: CourseEntity[];

  @ApiHideProperty() //TODO: разберись как в свагере отображать
  @OneToMany(() => CourseEntity, (course) => course.teacher)
  authoredCourses: CourseEntity[];

  @ApiProperty({
    example: [QuizEntity],
    description: 'Массив токенов пользователя',
  })
  @OneToMany(() => QuizEntity, (quiz) => quiz.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  quizzes: QuizEntity[];
}

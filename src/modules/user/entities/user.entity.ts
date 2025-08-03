import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
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
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @ApiProperty({
    type: () => [CourseEntity],
    description: 'Курсы, на которые пользователь подписан (студент)',
  })
  @ManyToMany(() => CourseEntity, (course) => course.students, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_courses',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'course_id', referencedColumnName: 'id' },
  })
  enrolledCourses: CourseEntity[];

  @ApiProperty({
    type: () => [CourseEntity],
    description: 'Курсы, созданные пользователем (преподаватель)',
  })
  @OneToMany(() => CourseEntity, (course) => course.teacher)
  authoredCourses: CourseEntity[];

  @ApiProperty({
    example: [QuizEntity],
    description: 'Массив токенов пользователя',
  })
  @OneToMany(() => QuizEntity, (quiz) => quiz.user, {
    cascade: true, // <--- Вот здесь
    onDelete: 'CASCADE',
  })
  quizzes: QuizEntity[];
}

// TODO: в дальнейшем мб надо
// @ApiProperty({ example: false, description: 'Статус автивации по почте' })
// @Column({ default: false })
// isActivated: boolean;

// @ApiProperty({
//   example: '97541ee5-795d-4a2d-a04b-4f7473c6822f',
//   description: 'Ссылка подтверждения почты',
// })
// @Column()
// activationLink: string;

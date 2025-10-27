import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/modules/user/entities/user.entity';
import { SurveyJsonDto } from '../dto/create-quiz.dto';
import { LessonEntity } from 'src/modules/lessons/entities/lesson.entity';

@Entity({ name: 'quiz' })
export class QuizEntity extends BaseEntity {
  @ApiProperty({ example: 1, description: 'Уникальный идентификатор опроса' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    type: SurveyJsonDto,
    description: 'Полная JSON-конфигурация опроса (SurveyJS)',
  })
  @Column({ type: 'jsonb', nullable: false })
  surveyJson: SurveyJsonDto;

  @ApiProperty({
    example: '3',
    description: 'ID пользователя',
  })
  @ManyToOne(() => UserEntity, (user) => user.quizzes, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty({
    example: 1,
    description: 'ID урока, к которому относится опрос',
  })
  @OneToOne(() => LessonEntity, (lesson) => lesson.quizId, {
    onDelete: 'CASCADE',
  })
  lessonId: LessonEntity;

  @ApiProperty({
    example: '2024-05-30T15:49:54.000Z',
    description: 'Дата и время создания опроса',
  })
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}

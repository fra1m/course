import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Entity({ name: 'quiz_attempts' })
@Unique(['user', 'quizId']) // храним одну «актуальную» запись на (user, quiz)
export class QuizAttemptEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.attemt, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user' })
  user: UserEntity;

  @Index()
  @Column({ name: 'quiz_id', type: 'int' })
  quizId: number;

  @Column({ name: 'lesson_id', type: 'int', nullable: true })
  lessonId: number | null;

  @Column({ name: 'course_id', type: 'int', nullable: true })
  courseId: number | null;

  @Column({ name: 'questions_total', type: 'int' })
  questionsTotal: number;

  @Column({ name: 'correct_count', type: 'int' })
  correctCount: number;

  @Column({ name: 'score', type: 'int' }) // 0..100 (всегда пересчитываем на бэке)
  score: number;

  @Column({ name: 'passed', type: 'boolean', default: false })
  passed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

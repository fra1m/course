import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { CourseEntity } from 'src/modules/courses/entities/course.entity';
import { UserEntity } from 'src/modules/user/entities/user.entity';

@Entity({ name: 'specializations' })
export class SpecializationEntity extends BaseEntity {
  @ApiProperty({ example: 1, description: 'ID специализации' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'frontend', description: 'Уникальный слаг' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: 'Frontend разработка', description: 'Название' })
  @Column()
  title: string;

  @ApiProperty({
    example: 'JS/TS, React, tooling',
    description: 'Описание',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiHideProperty() // чтобы не ловить циклы в Swagger
  @OneToMany(() => CourseEntity, (c) => c.specialization)
  courses: CourseEntity[];

  @ApiHideProperty()
  @OneToMany(() => UserEntity, (u) => u.specialization)
  students: UserEntity[];
}

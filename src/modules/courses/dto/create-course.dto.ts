import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Основы TypeScript', description: 'Название курса' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Изучите базовые концепции TypeScript',
    description: 'Описание курса',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';
// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { IsOptional, IsInt, Min } from 'class-validator';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  id: number;
}

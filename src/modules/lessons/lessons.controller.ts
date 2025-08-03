import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  create(@Body() createLessonDto: CreateLessonDto) {
    return '';
  }

  @Get('/genAndGet')
  async findAll() {
    console.dir('START');

    const res = await this.lessonsService.parseDocxToHtml(
      process.cwd() + '/src/static/DOC.docx',
    );
    console.dir('END%' + res, { depth: null });

    return res;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return '';
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return '';
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return '';
  }
}

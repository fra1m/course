import { Response, Request } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import {
  deferredCourseStorage,
  pdfOnlyFilter,
  persistBufferedPdf,
  RequestWithValidation,
  UploadFileLike,
} from './upload/storage';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { handleError } from 'src/utils/handleError';
import { User } from 'src/decorators/user.decorator';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.quard';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

import { basename } from 'path';
import { UpdateCourseDto } from './dto/update-course.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Roles('admin')
  @Post('/create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: deferredCourseStorage,
      fileFilter: pdfOnlyFilter,
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('/create')
  async createCourse(
    @User() user: JwtPayload,
    @Res() res: Response,
    @Req() req: RequestWithValidation,
    @Body() dto: CreateCourseDto,
    @UploadedFile() file?: UploadFileLike,
  ) {
    try {
      if (req.fileValidationError) {
        throw new BadRequestException(req.fileValidationError);
      }
      if (!file) {
        throw new BadRequestException('Файл обязателен и должен быть PDF');
      }

      const persisted = await persistBufferedPdf(file);
      const filePath = persisted.relPath;
      const payload = await this.coursesService.createCours(
        dto,
        user,
        filePath,
      );

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles('admin')
  @Patch('/update')
  @ApiConsumes('/update')
  async updateCourse(
    @User() user: JwtPayload,
    @Res() res: Response,
    @Body() dto: UpdateCourseDto,
  ) {
    try {
      const payload = await this.coursesService.updateCours(dto, user);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles('admin')
  @Delete('/delete')
  @ApiConsumes('/delete')
  async deleteCourse(
    @User() user: JwtPayload,
    @Res() res: Response,
    @Body() dto: UpdateCourseDto,
  ) {
    console.log('START DELETE COURSE', dto);

    try {
      const payload = await this.coursesService.deleteCourse(dto, user);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles('admin')
  @Get('getAllCourses')
  @ApiOkResponse({ description: 'Отдаёт курсы' })
  async getAllCourses(@User() user: JwtPayload, @Res() res: Response) {
    try {
      const payload = await this.coursesService.getAllCoursesByTeacherId(user);

      return res.status(HttpStatus.OK).json(payload);
    } catch (error) {
      return handleError(res, error);
    }
  }

  @Roles('admin')
  @Get(':id/file')
  async streamCoursePdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      console.log('start id/file');

      const absPath = await this.coursesService.getCourseFilePathById(id);
      const st = await stat(absPath);
      const filename = basename(absPath);

      // заголовки общие
      res.set({
        'Content-Type': 'application/pdf',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      });

      // без Range — отдаём целиком
      res.status(200).set('Content-Length', String(st.size));

      const fullStream = createReadStream(absPath);
      fullStream.on('error', (err) => {
        if (!res.headersSent) res.status(500).end('stream error');
        else res.destroy(err);
      });
      fullStream.pipe(res);
    } catch (error) {
      return handleError(res, error);
    }
  }
}

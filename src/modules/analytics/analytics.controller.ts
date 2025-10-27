import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';
import { AnalyticsService } from './analytics.service';
import { SubmitQuizDto } from './dto/create-analytics.dto';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { Role } from '../user/entities/user.entity';

@ApiTags('analytics')
@Controller('analytics')
@Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('quiz/submit')
  async submitQuiz(@Body() dto: SubmitQuizDto, @User() user: JwtPayload) {
    const payload = await this.analytics.submitQuizAttempt(user, dto);
    return payload;
  }
}

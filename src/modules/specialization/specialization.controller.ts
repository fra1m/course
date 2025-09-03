import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SpecializationService } from './specialization.service';
import { Roles } from 'src/decorators/roles-auth.decorator';
import { Role } from 'src/modules/user/entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.quard';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('specializations')
@Controller('specializations')
export class SpecializationController {
  constructor(private readonly specializationService: SpecializationService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Список специализаций' })
  @Get('/all')
  async list() {
    const payload = await this.specializationService.getAll();
    return payload;
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Создать специализацию' })
  @Post('/create')
  async create(
    @Body() dto: { slug: string; title: string; description?: string },
  ) {
    const payload = await this.specializationService.create(dto);
    return payload;
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Обновить специализацию' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: Partial<{ slug: string; title: string; description?: string }>,
  ) {
    const payload = await this.specializationService.update(id, dto);
    return payload;
  }
}

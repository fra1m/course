import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Role } from '../entities/user.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsString({ message: 'Должно быть строкой' })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID специализации (опционально)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  specializationId?: number;
}

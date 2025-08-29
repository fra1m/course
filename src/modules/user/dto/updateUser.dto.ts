import { IsOptional, IsString } from 'class-validator';
import { Role } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString({ message: 'Должно быть строкой' })
  @IsOptional()
  role?: Role;
}

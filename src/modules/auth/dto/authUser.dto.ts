import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';
// import { UserEntity } from 'src/modules/user/entities/user.entity';

export class AuthUserDto {
  @ApiProperty({
    // type: PickType(UserEntity, ['email'] as const)['email'],
    description: 'Почта пользователя',
  })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Не корректный логин' })
  email: string;

  @ApiProperty({
    example: 'pass123',
    description: 'Пароль пользователя',
    minLength: 6,
    maxLength: 16,
  })
  @IsString({ message: 'Должно быть строкой' })
  @Length(6, 16, {
    message: 'Не корректный пароль',
  })
  password: string;
}

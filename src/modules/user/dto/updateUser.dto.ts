import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'user_uf3h4u@example.com',
    description: 'Почта пользователя',
  })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Не корректный email' })
  email: string;

  @ApiProperty({
    example: '123pass',
    description: 'Новый пароль пользователя',
    minLength: 4,
    maxLength: 16,
  })
  @IsString({ message: 'Должно быть строкой' })
  @Length(4, 16, {
    message: 'Длинна пароля должна быть не меньше 4 и не больше 16',
  })
  newPassword: string;

  @ApiProperty({
    example: 'pass123',
    description: 'Пароль пользователя',
    minLength: 6,
    maxLength: 16,
  })
  @IsString({ message: 'Должно быть строкой' })
  @Length(6, 16, {
    message: 'Длинна пароля должна быть не меньше 6 и не больше 16',
  })
  password: string;
}

import { ValidationException } from 'src/exceptions/validation.exception';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private isPrimitiveType(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return types.includes(metatype);
  }

  async transform(value: unknown, metadata: ArgumentMetadata): Promise<any> {
    if (!metadata.metatype || this.isPrimitiveType(metadata.metatype)) {
      return value;
    }

    if (metadata.type === 'param') {
      return value;
    }

    const metatype = metadata.metatype as new (...args: any[]) => object;
    const obj = plainToInstance(metatype, value as object);
    const errors = await validate(obj);

    if (errors.length) {
      const messages = errors.map((err) => {
        return `${err.property} - ${Object.values(err.constraints ?? {}).join(', ')}`;
      });
      throw new ValidationException(messages);
    }

    return value;
  }
}

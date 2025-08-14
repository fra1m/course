// TODO: Добавить сервис PDF для чтения и преобразование в HTML дя фронта
// TODO: npm install pdf-parse
// TODO: npm install --save-dev @types/pdf-parse

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from './pipes/validation.pipe';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);
  const host = configService.get<string>('API_HOST');

  const config = new DocumentBuilder()
    .setTitle('RESTful API для управления к API Course')
    .setDescription('Документация по REST API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({ origin: process.env.CLIENT_URL, credentials: true });

  app.use(cookieParser());

  await app.listen(process.env.API_PORT ?? 8080);
  console.log(
    `App started on ${await app.getUrl()} \n ${host}${port}\nДокументация: ${host}${port}/docs`,
  );
}
void bootstrap();

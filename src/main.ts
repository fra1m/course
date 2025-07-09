import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from './pipes/validation.pipe';
// import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);
  const host = configService.get<string>('API_HOST');

  const config = new DocumentBuilder()
    .setTitle('RESTful API для управления к API Course')
    .setDescription('Документация по REST API')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/swagger', app, document);

  app.useGlobalPipes(new ValidationPipe());

  // app.enableCors({
  //   origin: configService.get('CLIENT_URL'), // Разрешаем запросы только с этого домена
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Разрешенные методы
  //   credentials: true, // Если нужно передавать cookies или заголовки авторизации
  // });

  // app.use(cookieParser());

  await app.listen(port);
  console.log(
    `App started on ${host}${port}\nДокументация: ${host}${port}/swagger`,
  );
}
bootstrap();

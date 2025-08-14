import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  // Простой liveness
  @Get()
  liveness() {
    return { status: 'ok', ts: Date.now() };
  }

  // Готовность: проверяем, что есть коннект к БД
  @Get('ready')
  async readiness() {
    await this.ds.query('SELECT 1'); // упадёт, если БД недоступна
    return { status: 'ready', ts: Date.now() };
  }
}

import { Module } from '@nestjs/common';
import { SpecializationService } from './specialization.service';
import { SpecializationController } from './specialization.controller';
import { SpecializationEntity } from './entities/specialization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SpecializationEntity]), AuthModule],
  controllers: [SpecializationController],
  providers: [SpecializationService],
  exports: [SpecializationService],
})
export class SpecializationModule {}

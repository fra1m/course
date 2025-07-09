import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { SectionEntity } from './entities/section.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SectionEntity])],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}

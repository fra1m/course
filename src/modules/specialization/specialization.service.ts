import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SpecializationEntity } from './entities/specialization.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SpecializationService {
  constructor(
    @InjectRepository(SpecializationEntity)
    private specializationRepository: Repository<SpecializationEntity>,
  ) {}

  async getAll() {
    const specialization = await this.specializationRepository.find({
      order: { title: 'ASC' },
    });
    return specialization;
  }

  async create(dto: { slug: string; title: string; description?: string }) {
    const exists = await this.specializationRepository.findOne({
      where: { slug: dto.slug },
    });
    if (exists) throw new BadRequestException('Слаг уже занят');
    return this.specializationRepository.save(
      this.specializationRepository.create(dto),
    );
  }

  async findSpecById(id: number) {
    const specialization = await this.specializationRepository.findOne({
      where: { id },
    });
    if (!specialization)
      throw new BadRequestException('Специализация не найдена');

    return specialization;
  }

  async update(
    id: number,
    dto: Partial<{ slug: string; title: string; description?: string }>,
  ) {
    const entity = await this.specializationRepository.findOne({
      where: { id },
    });
    if (!entity) throw new NotFoundException('Специализация не найдена');
    Object.assign(entity, dto);
    return this.specializationRepository.save(entity);
  }
}

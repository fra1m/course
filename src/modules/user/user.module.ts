import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserStatsEntity } from './entities/user-stats.entity';
import { SpecializationModule } from '../specialization/specialization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserStatsEntity]),
    AuthModule,
    SpecializationModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

import { Global, Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { AuthModule } from 'src/modules/auth/auth.module';

@Global()
@Module({
  imports: [AuthModule], // чтобы инжектить AuthService
  providers: [NotificationsGateway],
  exports: [NotificationsGateway], // чтобы вызывать notify... из сервисов
})
export class RealtimeModule {}

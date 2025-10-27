// src/modules/realtime/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  // SubscribeMessage,
  // MessageBody,
  // ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
@WebSocketGateway({
  namespace: '/ws',
  transports: ['websocket', 'polling'],
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly log = new Logger(NotificationsGateway.name);

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    const token = this.extractAccessToken(client);
    if (!token) {
      this.log.warn('Handshake without token -> disconnect');
      return client.disconnect(true);
    }

    const payload = this.authService.validateAccessToken(token);
    if (!payload) {
      this.log.warn('Invalid token -> disconnect');
      return client.disconnect(true);
    }

    client.data.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      specializationId: payload.specializationId ?? null,
    };
    await client.join(this.userRoom(payload.id));

    this.log.log(`Client connected uid=${payload.id} socket=${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.log.log(`Client disconnected socket=${client.id}`);
  }

  private userRoom(userId: number) {
    return `user:${userId}`;
  }

  private extractAccessToken(client: Socket): string | null {
    const fromAuth = client.handshake?.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth.trim()) return fromAuth.trim();
    const hdr = client.handshake?.headers?.authorization;
    if (typeof hdr === 'string') {
      const m = /^Bearer\s+(.+)$/i.exec(hdr);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  }

  // Публичный метод для сервисов
  notifyUserSpecializationChanged(
    userId: number,
    specializationId: number | null,
  ) {
    this.server.to(this.userRoom(userId)).emit('specialization-changed', {
      specializationId,
      ts: Date.now(),
    });
  }
}

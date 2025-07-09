import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express'; // Добавь вверху
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from 'src/decorators/roles-auth.decorator';
import { JwtPayload } from 'src/interfaces/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>() as Request & {
      user?: JwtPayload;
    };
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Нет заголовка авторизации');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Неверный формат токена');
    }

    try {
      const user = this.jwtService.verify<JwtPayload>(token);
      req.user = user;

      const userRoles = Array.isArray(user.role) ? user.role : [user.role];

      const hasRole = userRoles.some((role: string) =>
        requiredRoles.includes(role),
      );

      if (!hasRole) {
        throw new HttpException('Недостаточно прав', HttpStatus.FORBIDDEN);
      }

      return true;
    } catch {
      // if (e.name === 'TokenExpiredError') {
      //   throw new UnauthorizedException('Токен истёк');
      // }

      throw new HttpException('Доступ запрещён', HttpStatus.FORBIDDEN);
    }
  }
}

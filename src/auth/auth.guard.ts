import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/auth/public/public.decorator';
import { jwtConstants } from './auth.constants';
import { JwtPayloadEntity } from './entities/jwt-payload.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token === undefined) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayloadEntity>(
        token,
        {
          secret: jwtConstants.accessTokenSecret,
        },
      );
      request['jwtPayload'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

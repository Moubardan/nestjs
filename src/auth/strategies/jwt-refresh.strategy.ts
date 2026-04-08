import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { UserPayload } from '../../users/user.model';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret-dev',
      passReqToCallback: true, 
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<UserPayload> {
    const authHeader = req.get('Authorization') ?? '';
    const refreshToken = authHeader.replace('Bearer ', '').trim();

    const user = this.usersService.findById(payload.sub);

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('No active session — please log in again');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}

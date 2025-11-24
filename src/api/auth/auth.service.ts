import {
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { appConfig } from 'src/config';
import { successRes } from 'src/infrastructure/response/success.response';
import { IToken } from 'src/infrastructure/token/interface';
import { TokenService } from 'src/infrastructure/token/Token';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: TokenService) {}

  async newToken(repository: Repository<any>, token: string) {
    const data: any = await this.jwt.verifyToken(
      token,
      appConfig.TOKEN.REFRESH_TOKEN_KEY,
    );
    if (!data) {
      throw new HttpException('Authorization error', 401);
    }

    const user = await repository.findOne({ where: { id: data?.id } });
    if (!user) {
      throw new ForbiddenException('Forbidden user');
    }
    const paylod: IToken = {
      id: user.id,
      isActive: user.isActive,
      role: user.role,
    };
    const accessToken = await this.jwt.accessToken(paylod);
    return successRes({ token: accessToken, paylod });
  }

  async signOut(res: Response, tokenKey: string) {
    res.clearCookie(tokenKey);
    return successRes({});
  }
}

import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionTokenService {
  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

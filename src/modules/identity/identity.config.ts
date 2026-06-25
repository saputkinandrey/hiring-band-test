import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IdentityConfig {
  constructor(private readonly configService: ConfigService) {}

  get sessionCookieName(): string {
    return this.configService.getOrThrow<string>('SESSION_COOKIE_NAME');
  }

  get sessionTtlSeconds(): number {
    return this.parsePositiveInt('SESSION_TTL_SECONDS');
  }

  get bcryptSaltRounds(): number {
    return this.parsePositiveInt('BCRYPT_SALT_ROUNDS');
  }

  private parsePositiveInt(key: string): number {
    const raw = this.configService.getOrThrow<string>(key);
    const value = Number.parseInt(raw, 10);

    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Invalid ${key}: expected positive integer`);
    }

    return value;
  }
}

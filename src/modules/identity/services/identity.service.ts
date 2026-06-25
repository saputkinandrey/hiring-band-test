import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { TenantRepository } from '../../../common/db/repositories/tenant.repository';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';
import { IdentityConfig } from '../identity.config';
import { SessionRepository } from '../repositories/session.repository';
import { UserRepository } from '../repositories/user.repository';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import type { LoginResponse } from '../types/login-response.type';
import type { ProfileResponse } from '../types/profile-response.type';
import type { RegisterResponse } from '../types/register-response.type';
import { SessionTokenService } from './session-token.service';

type RegisterInput = RegisterDto & {
  correlationId: string;
};

type LoginInput = LoginDto & {
  correlationId: string;
};

type ResolveSessionInput = {
  sessionToken: string | undefined;
  correlationId: string;
};

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly sessionTokenService: SessionTokenService,
    private readonly identityConfig: IdentityConfig,
  ) {}

  async register(input: RegisterInput): Promise<RegisterResponse> {
    await this.ensureActiveTenant(input.brandId, input.correlationId);

    const email = this.normalizeEmail(input.email);
    const passwordHash = await bcrypt.hash(
      input.password,
      this.identityConfig.bcryptSaltRounds,
    );

    try {
      const user = await this.userRepository.create({
        brandId: input.brandId,
        email,
        passwordHash,
      });

      this.logger.log(
        `[${input.correlationId}] Registered user ${user.id} in tenant ${user.brandId}`,
      );

      return {
        id: user.id,
        brandId: user.brandId,
        email: user.email,
        createdAt: user.createdAt,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppHttpException(
          HttpStatus.CONFLICT,
          'DUPLICATE_EMAIL',
          'Email is already registered for this tenant',
        );
      }

      throw error;
    }
  }

  async login(
    input: LoginInput,
  ): Promise<LoginResponse & { sessionToken: string }> {
    await this.ensureActiveTenant(input.brandId, input.correlationId);

    const email = this.normalizeEmail(input.email);
    const user = await this.userRepository.findByBrandAndEmail(
      input.brandId,
      email,
    );

    if (!user) {
      this.logger.warn(
        `[${input.correlationId}] Login failed for tenant ${input.brandId}`,
      );
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      this.logger.warn(
        `[${input.correlationId}] Login failed for tenant ${input.brandId}`,
      );
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    const sessionToken = this.sessionTokenService.generateToken();
    const tokenHash = this.sessionTokenService.hashToken(sessionToken);
    const expiresAt = new Date(
      Date.now() + this.identityConfig.sessionTtlSeconds * 1000,
    );

    await this.sessionRepository.create({
      brandId: user.brandId,
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    this.logger.log(
      `[${input.correlationId}] Created session for user ${user.id} in tenant ${user.brandId}`,
    );

    return {
      brandId: user.brandId,
      userId: user.id,
      expiresAt,
      sessionToken,
    };
  }

  async resolveAuthenticatedUser(
    input: ResolveSessionInput,
  ): Promise<AuthenticatedUser> {
    if (!input.sessionToken) {
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Session cookie is missing',
      );
    }

    const tokenHash = this.sessionTokenService.hashToken(input.sessionToken);
    const session =
      await this.sessionRepository.findActiveByTokenHash(tokenHash);

    if (!session || session.user.brandId !== session.brandId) {
      this.logger.warn(
        `[${input.correlationId}] Profile access denied: invalid session`,
      );
      throw new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Session is invalid or expired',
      );
    }

    return {
      id: session.user.id,
      brandId: session.user.brandId,
      email: session.user.email,
      createdAt: session.user.createdAt,
    };
  }

  toProfileResponse(user: AuthenticatedUser): ProfileResponse {
    return {
      id: user.id,
      brandId: user.brandId,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private async ensureActiveTenant(
    brandId: string,
    correlationId: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findActiveByBrandId(brandId);

    if (!tenant) {
      this.logger.warn(
        `[${correlationId}] Tenant ${brandId} is missing or inactive`,
      );
      throw new AppHttpException(
        HttpStatus.BAD_REQUEST,
        'TENANT_NOT_FOUND',
        'Tenant is missing or inactive',
      );
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

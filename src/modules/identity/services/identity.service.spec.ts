import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { TenantRepository } from '../../../common/db/repositories/tenant.repository';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import { IdentityConfig } from '../identity.config';
import { SessionRepository } from '../repositories/session.repository';
import { UserRepository } from '../repositories/user.repository';
import { IdentityService } from './identity.service';
import { SessionTokenService } from './session-token.service';

describe('IdentityService', () => {
  let identityService: IdentityService;
  let userRepository: {
    create: jest.Mock;
    findByBrandAndEmail: jest.Mock;
  };
  let sessionRepository: {
    create: jest.Mock;
    findActiveByTokenHash: jest.Mock;
  };
  let tenantRepository: {
    findActiveByBrandId: jest.Mock;
  };
  let sessionTokenService: {
    generateToken: jest.Mock;
    hashToken: jest.Mock;
  };
  let identityConfig: {
    bcryptSaltRounds: number;
    sessionTtlSeconds: number;
  };

  beforeEach(async () => {
    userRepository = {
      create: jest.fn(),
      findByBrandAndEmail: jest.fn(),
    };
    sessionRepository = {
      create: jest.fn(),
      findActiveByTokenHash: jest.fn(),
    };
    tenantRepository = {
      findActiveByBrandId: jest.fn(),
    };
    sessionTokenService = {
      generateToken: jest.fn(),
      hashToken: jest.fn(),
    };
    identityConfig = {
      bcryptSaltRounds: 12,
      sessionTtlSeconds: 604800,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
        {
          provide: SessionRepository,
          useValue: sessionRepository,
        },
        {
          provide: TenantRepository,
          useValue: tenantRepository,
        },
        {
          provide: SessionTokenService,
          useValue: sessionTokenService,
        },
        {
          provide: IdentityConfig,
          useValue: identityConfig,
        },
      ],
    }).compile();

    identityService = module.get(IdentityService);
  });

  it('registers a user for an active tenant', async () => {
    tenantRepository.findActiveByBrandId.mockResolvedValue({
      brandId: 'brandA',
      name: 'Brand A',
      deletedAt: null,
    });
    userRepository.create.mockResolvedValue({
      id: 'user-1',
      brandId: 'brandA',
      email: 'user@example.com',
      passwordHash: 'hash',
      createdAt: new Date('2026-06-25T10:00:00.000Z'),
      deletedAt: null,
    });

    const result = await identityService.register({
      brandId: 'brandA',
      email: 'User@Example.com',
      password: 'StrongPassword123!',
      correlationId: 'corr-1',
    });

    expect(result).toEqual({
      id: 'user-1',
      brandId: 'brandA',
      email: 'user@example.com',
      createdAt: new Date('2026-06-25T10:00:00.000Z'),
    });
    expect(userRepository.create).toHaveBeenCalledWith({
      brandId: 'brandA',
      email: 'user@example.com',
      passwordHash: expect.any(String),
    });
  });

  it('rejects login with invalid credentials', async () => {
    tenantRepository.findActiveByBrandId.mockResolvedValue({
      brandId: 'brandA',
      name: 'Brand A',
      deletedAt: null,
    });
    userRepository.findByBrandAndEmail.mockResolvedValue(null);

    await expect(
      identityService.login({
        brandId: 'brandA',
        email: 'user@example.com',
        password: 'wrong-password',
        correlationId: 'corr-2',
      }),
    ).rejects.toEqual(
      new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      ),
    );
  });

  it('creates a session on successful login', async () => {
    const passwordHash = await bcrypt.hash('StrongPassword123!', 4);

    tenantRepository.findActiveByBrandId.mockResolvedValue({
      brandId: 'brandA',
      name: 'Brand A',
      deletedAt: null,
    });
    userRepository.findByBrandAndEmail.mockResolvedValue({
      id: 'user-1',
      brandId: 'brandA',
      email: 'user@example.com',
      passwordHash,
      createdAt: new Date('2026-06-25T10:00:00.000Z'),
      deletedAt: null,
    });
    sessionTokenService.generateToken.mockReturnValue('raw-session-token');
    sessionTokenService.hashToken.mockReturnValue('hashed-session-token');

    const result = await identityService.login({
      brandId: 'brandA',
      email: 'user@example.com',
      password: 'StrongPassword123!',
      correlationId: 'corr-3',
    });

    expect(result.sessionToken).toBe('raw-session-token');
    expect(sessionRepository.create).toHaveBeenCalledWith({
      brandId: 'brandA',
      userId: 'user-1',
      tokenHash: 'hashed-session-token',
      expiresAt: expect.any(Date),
    });
  });

  it('rejects profile resolution when session cookie is missing', async () => {
    await expect(
      identityService.resolveAuthenticatedUser({
        sessionToken: undefined,
        correlationId: 'corr-4',
      }),
    ).rejects.toEqual(
      new AppHttpException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        'Session cookie is missing',
      ),
    );
  });
});

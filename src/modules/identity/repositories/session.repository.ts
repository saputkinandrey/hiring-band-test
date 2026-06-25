import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/db/services/prisma.service';
import type {
  CreateSessionInput,
  SessionWithUserRecord,
} from '../types/session-record.type';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput): Promise<void> {
    await this.prisma.session.create({
      data: input,
    });
  }

  async findActiveByTokenHash(
    tokenHash: string,
  ): Promise<SessionWithUserRecord | null> {
    const now = new Date();

    return this.prisma.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
        user: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        brandId: true,
        userId: true,
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            brandId: true,
            email: true,
            passwordHash: true,
            createdAt: true,
            deletedAt: true,
          },
        },
      },
    });
  }
}

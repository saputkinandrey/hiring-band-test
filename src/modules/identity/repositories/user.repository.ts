import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/db/services/prisma.service';
import type { CreateUserInput, UserRecord } from '../types/user-record.type';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<UserRecord> {
    return this.prisma.user.create({
      data: input,
      select: {
        id: true,
        brandId: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        deletedAt: true,
      },
    });
  }

  async findByBrandAndEmail(
    brandId: string,
    email: string,
  ): Promise<UserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        brandId,
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        brandId: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        deletedAt: true,
      },
    });
  }
}

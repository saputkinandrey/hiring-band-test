import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import type { TenantRecord } from './tenant.repository.types';

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByBrandId(brandId: string): Promise<TenantRecord | null> {
    return this.prisma.tenant.findFirst({
      where: {
        brandId,
        deletedAt: null,
      },
      select: {
        brandId: true,
        name: true,
        deletedAt: true,
      },
    });
  }
}

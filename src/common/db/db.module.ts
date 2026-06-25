import { Global, Module } from '@nestjs/common';
import { TenantRepository } from './repositories/tenant.repository';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  providers: [PrismaService, TenantRepository],
  exports: [PrismaService, TenantRepository],
})
export class DbModule {}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { TenantSeed } from './tenant-seed.type';

const prisma = new PrismaClient();

function loadTenantSeeds(): TenantSeed[] {
  const tenantsPath = join(__dirname, 'data', 'tenants.json');
  const raw = readFileSync(tenantsPath, 'utf-8');
  return JSON.parse(raw) as TenantSeed[];
}

async function seedTenants(): Promise<void> {
  const tenantSeeds = loadTenantSeeds();

  for (const tenant of tenantSeeds) {
    await prisma.tenant.upsert({
      where: { brandId: tenant.brandId },
      update: { name: tenant.name },
      create: tenant,
    });
  }
}

async function main(): Promise<void> {
  await seedTenants();
}

main()
  .catch(async (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

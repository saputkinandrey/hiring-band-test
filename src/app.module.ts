import { Module } from '@nestjs/common';
import { CallbacksModule } from './modules/callbacks/callbacks.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';

@Module({
  imports: [HealthModule, IdentityModule, CallbacksModule, DbModule],
})
export class AppModule {}

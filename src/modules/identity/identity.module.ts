import { Module } from '@nestjs/common';
import { IdentityController } from './controllers/identity.controller';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { IdentityConfig } from './identity.config';
import { SessionRepository } from './repositories/session.repository';
import { UserRepository } from './repositories/user.repository';
import { IdentityService } from './services/identity.service';
import { SessionTokenService } from './services/session-token.service';

@Module({
  controllers: [IdentityController],
  providers: [
    IdentityConfig,
    IdentityService,
    UserRepository,
    SessionRepository,
    SessionTokenService,
    SessionAuthGuard,
  ],
})
export class IdentityModule {}

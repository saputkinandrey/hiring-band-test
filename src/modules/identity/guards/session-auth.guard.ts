import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { RequestWithCorrelation } from '../../../common/types/request-with-correlation.type';
import { IdentityConfig } from '../identity.config';
import { IdentityService } from '../services/identity.service';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

export type AuthenticatedRequest = RequestWithCorrelation & {
  user: AuthenticatedUser;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly identityService: IdentityService,
    private readonly identityConfig: IdentityConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionToken = request.cookies?.[
      this.identityConfig.sessionCookieName
    ] as string | undefined;

    request.user = await this.identityService.resolveAuthenticatedUser({
      sessionToken,
      correlationId: request.correlationId,
    });

    return true;
  }
}

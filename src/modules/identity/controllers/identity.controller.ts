import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { RequestWithCorrelation } from '../../../common/types/request-with-correlation.type';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { SessionAuthGuard } from '../guards/session-auth.guard';
import { buildSessionCookie } from '../http/session-cookie';
import { IdentityConfig } from '../identity.config';
import { IdentityService } from '../services/identity.service';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import type { LoginResponse } from '../types/login-response.type';
import type { ProfileResponse } from '../types/profile-response.type';
import type { RegisterResponse } from '../types/register-response.type';

@ApiTags('identity')
@Controller()
export class IdentityController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly identityConfig: IdentityConfig,
  ) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a user within a tenant' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiBadRequestResponse({ description: 'Validation or tenant error' })
  @ApiConflictResponse({ description: 'Duplicate email within tenant' })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: RequestWithCorrelation,
  ): Promise<RegisterResponse> {
    return this.identityService.register({
      ...registerDto,
      correlationId: request.correlationId,
    });
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and create a session cookie' })
  @ApiOkResponse({ description: 'Session created successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: RequestWithCorrelation,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const loginResult = await this.identityService.login({
      ...loginDto,
      correlationId: request.correlationId,
    });

    const sessionCookie = buildSessionCookie({
      token: loginResult.sessionToken,
      cookieName: this.identityConfig.sessionCookieName,
      ttlSeconds: this.identityConfig.sessionTtlSeconds,
    });
    response.cookie(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options,
    );

    return {
      brandId: loginResult.brandId,
      userId: loginResult.userId,
      expiresAt: loginResult.expiresAt,
    };
  }

  @Get('profile/me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Profile returned successfully' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid session' })
  getProfile(@CurrentUser() user: AuthenticatedUser): ProfileResponse {
    return this.identityService.toProfileResponse(user);
  }
}

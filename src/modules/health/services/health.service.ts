import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '../health-response.type';

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}

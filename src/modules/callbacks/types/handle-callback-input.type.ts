import type { CallbackSource } from '../callbacks.constants';
import type { CallbackPayloadDto } from '../dto/callback-payload.dto';

export type HandleCallbackInput = {
  source: CallbackSource;
  provider: string;
  dto: CallbackPayloadDto;
  correlationId: string;
};

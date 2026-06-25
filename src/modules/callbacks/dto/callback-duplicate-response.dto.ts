import { ApiProperty } from '@nestjs/swagger';
import {
  CALLBACK_RESPONSE_STATUS_DUPLICATE,
  CALLBACK_SOURCE_PSP,
  CallbackSource,
} from '../callbacks.constants';

export class CallbackDuplicateResponseDto {
  @ApiProperty({ example: CALLBACK_RESPONSE_STATUS_DUPLICATE })
  status!: typeof CALLBACK_RESPONSE_STATUS_DUPLICATE;

  @ApiProperty({ example: 'brandA' })
  brandId!: string;

  @ApiProperty({ enum: CallbackSource, example: CALLBACK_SOURCE_PSP })
  source!: CallbackSource;

  @ApiProperty({ example: 'stripe' })
  provider!: string;

  @ApiProperty({ example: 'psp-payment-evt-001' })
  idempotencyKey!: string;
}

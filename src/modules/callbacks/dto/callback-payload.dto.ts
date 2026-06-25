import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CallbackPayloadDto {
  @ApiProperty({ example: 'brandA' })
  @IsString()
  @IsNotEmpty()
  brandId!: string;

  @ApiProperty({ example: 'psp-payment-evt-001' })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @ApiProperty({
    example: {
      amount: 1000,
      currency: 'USD',
      status: 'completed',
    },
  })
  @IsObject()
  payload!: Record<string, unknown>;
}

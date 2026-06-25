import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { RequestWithCorrelation } from '../../../common/types/request-with-correlation.type';
import { CALLBACK_SOURCE_GSP } from '../callbacks.constants';
import { CallbackAcceptedResponseDto } from '../dto/callback-accepted-response.dto';
import { CallbackDuplicateResponseDto } from '../dto/callback-duplicate-response.dto';
import { CallbackPayloadDto } from '../dto/callback-payload.dto';
import { CallbackService } from '../services/callback.service';
import type { CallbackResponse } from '../types/callback-response.type';

@ApiTags('callbacks')
@ApiExtraModels(CallbackAcceptedResponseDto, CallbackDuplicateResponseDto)
@Controller('webhooks/gsp')
export class GspCallbackController {
  constructor(private readonly callbackService: CallbackService) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive a GSP provider callback' })
  @ApiOkResponse({
    description: 'Callback accepted or treated as duplicate',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CallbackAcceptedResponseDto) },
        { $ref: getSchemaPath(CallbackDuplicateResponseDto) },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Payload validation or tenant validation error',
  })
  async handleGspCallback(
    @Param('provider') provider: string,
    @Body() callbackPayloadDto: CallbackPayloadDto,
    @Req() request: RequestWithCorrelation,
  ): Promise<CallbackResponse> {
    return this.callbackService.handleCallback({
      source: CALLBACK_SOURCE_GSP,
      provider,
      dto: callbackPayloadDto,
      correlationId: request.correlationId,
    });
  }
}

import { Module } from '@nestjs/common';
import { GspCallbackController } from './controllers/gsp-callback.controller';
import { PspCallbackController } from './controllers/psp-callback.controller';
import { RawEventRepository } from './repositories/raw-event.repository';
import { CallbackService } from './services/callback.service';

@Module({
  controllers: [PspCallbackController, GspCallbackController],
  providers: [CallbackService, RawEventRepository],
})
export class CallbacksModule {}

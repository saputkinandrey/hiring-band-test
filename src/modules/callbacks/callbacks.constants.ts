export { CallbackSource } from '@prisma/client';

import { CallbackSource } from '@prisma/client';

export const CALLBACK_SOURCE_PSP = CallbackSource.psp;

export const CALLBACK_SOURCE_GSP = CallbackSource.gsp;

export const RAW_EVENT_STATUS_PENDING = 'pending';

export type RawEventStatus = typeof RAW_EVENT_STATUS_PENDING;

export const CALLBACK_RESPONSE_STATUS_ACCEPTED = 'accepted';

export const CALLBACK_RESPONSE_STATUS_DUPLICATE = 'duplicate';

export type CallbackResponseStatus =
  | typeof CALLBACK_RESPONSE_STATUS_ACCEPTED
  | typeof CALLBACK_RESPONSE_STATUS_DUPLICATE;

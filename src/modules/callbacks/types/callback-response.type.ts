import type {
  CallbackResponseStatus,
  CallbackSource,
} from '../callbacks.constants';

export type CallbackAcceptedResponse = {
  status: CallbackResponseStatus;
  rawEventId: string;
  brandId: string;
  source: CallbackSource;
  provider: string;
  idempotencyKey: string;
};

export type CallbackDuplicateResponse = {
  status: CallbackResponseStatus;
  brandId: string;
  source: CallbackSource;
  provider: string;
  idempotencyKey: string;
};

export type CallbackResponse =
  | CallbackAcceptedResponse
  | CallbackDuplicateResponse;

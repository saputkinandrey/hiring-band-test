import { HttpException } from '@nestjs/common';

export class AppHttpException extends HttpException {
  readonly errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message, statusCode);
    this.errorCode = errorCode;
  }
}

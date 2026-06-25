export type ApiErrorResponse = {
  statusCode: number;
  errorCode: string;
  message: string;
  path: string;
  correlationId: string;
};

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '@webin10/shared-types';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let errorDetails: any = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as any;
      errorMessage = respObj.message || errorMessage;
      errorCode = respObj.error || `HTTP_${status}`;
      errorDetails = respObj.details || (Array.isArray(respObj.message) ? respObj.message : undefined);
    } else if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
        details: errorDetails,
      },
      meta: {
        requestId: (request.headers['x-request-id'] as string) || undefined,
        timestamp: new Date().toISOString(),
      },
    };

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(errorPayload.error)}`,
    );

    response.status(status).json(errorPayload);
  }
}

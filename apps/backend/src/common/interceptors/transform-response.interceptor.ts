import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@webin10/shared-types';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((res) => {
        // If the controller already returned a custom formatted ApiResponse, leave it intact
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }

        return {
          success: true,
          data: res,
          meta: {
            requestId: request.headers['x-request-id'] || undefined,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Output {
  // #region Object Properties

  keys?: unknown;
  terms?: unknown;

  // #endregion Object Properties
}

/**
 * Clean up output based on query params (or lack thereof)
 */
@Injectable()
export class UtilizationCleanup
  implements NestInterceptor<Output, Partial<Output>> {
  // #region Public Methods

  public cleanup(
    license: Output,
    showOptions: Partial<Record<'terms' | 'keys', number>>,
  ): Partial<Output> {
    if (!showOptions.keys) {
      license.keys = null;
    }
    if (!showOptions.terms) {
      license.terms = null;
    }
    return license;
  }

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Partial<Output>> {
    const req = context.switchToHttp().getRequest() as Request;
    return next
      .handle()
      .pipe(map((res: Output) => this.cleanup(res, req.params)));
  }

  // #endregion Public Methods
}
import { LIB_SERVER, LibraryModule } from '@automagical/utilities';
import {
  INestApplication,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';

import { AdminKeyGuard } from '..';
import { LoggingInterceptor } from '../interceptors';
import { InitMiddleware } from '../middleware';
import { BootstrapService, RouteInjector } from '../services';

@LibraryModule({
  exports: [RouteInjector],
  library: LIB_SERVER,
  providers: [
    BootstrapService,
    AdminKeyGuard,
    RouteInjector,
    LoggingInterceptor,
    InitMiddleware,
  ],
})
export class ServerModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(InitMiddleware)
      .forRoutes({ method: RequestMethod.ALL, path: '*' });
  }

  protected onPreInit(app: INestApplication): void {
    const interceptor = app.get(LoggingInterceptor);
    app.useGlobalInterceptors(interceptor);
  }
}

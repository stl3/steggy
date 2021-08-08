import { LOG_LEVEL } from '@automagical/contracts/config';
import { LIB_UTILS } from '@automagical/contracts/constants';
import { APIRequest, APIResponse } from '@automagical/contracts/server';
import {
  CacheModule,
  DynamicModule,
  Global,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { NextFunction } from 'express';
import pinoHttp from 'pino-http';

import { createProvidersForDecorated } from '../decorators';
import { LoggableModule } from '../decorators/logger/loggable-module.decorator';
import { expressContextMiddleware, expressContextSetValue } from '../includes';
import {
  AutoConfigService,
  AutoLogService,
  FetchService,
  LocalsService,
  LogExplorerService,
  SolarCalcService,
  TemplateService,
} from '../services';

const DEFAULT_ROUTES = [{ method: RequestMethod.ALL, path: '*' }];

@Global()
@Module({
  exports: [
    TemplateService,
    AutoConfigService,
    LocalsService,
    FetchService,
    AutoLogService,
    SolarCalcService,
  ],
  imports: [CacheModule.register(), DiscoveryModule],
  providers: [
    TemplateService,
    AutoLogService,
    LocalsService,
    AutoConfigService,
    FetchService,
    SolarCalcService,
    LogExplorerService,
  ],
})
@LoggableModule(LIB_UTILS)
export class UtilitiesModule {
  // #region Public Static Methods

  public static forRoot(): DynamicModule {
    const decorated = createProvidersForDecorated();
    return {
      exports: [
        TemplateService,
        AutoConfigService,
        AutoLogService,
        ...decorated,
        LocalsService,
        FetchService,
        SolarCalcService,
      ],
      global: true,
      imports: [CacheModule.register(), DiscoveryModule],
      module: UtilitiesModule,
      providers: [
        TemplateService,
        ...decorated,
        LocalsService,
        AutoConfigService,
        AutoLogService,
        FetchService,
        SolarCalcService,
        LogExplorerService,
      ],
    };
  }

  // #endregion Public Static Methods

  // #region Constructors

  constructor(private readonly configService: AutoConfigService) {}

  // #endregion Constructors

  // #region Protected Methods

  protected configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        expressContextMiddleware,
        pinoHttp({
          level: this.configService.get(LOG_LEVEL),
        }),
        bindLoggerMiddleware,
      )
      .forRoutes(...DEFAULT_ROUTES);
  }

  // #endregion Protected Methods
}

function bindLoggerMiddleware(
  request: APIRequest,
  response: APIResponse,
  next: NextFunction,
) {
  expressContextSetValue('logger', request.log);
  next();
}

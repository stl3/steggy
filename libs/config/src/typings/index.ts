import { FormioSDKConfig } from './formio-sdk';
import { HomeAssistantConfig } from './home-assistant';
export * from './formio-sdk';
export * from './home-assistant';
import { PinoLogger } from 'nestjs-pino';

import { AuthenticationConfig } from './authentication';

export class AutomagicalConfig<
  Application extends Record<never, unknown> = Record<never, unknown>
> {
  // #region Object Properties

  /**
   * Body parsing max size
   */
  public BODY_SIZE?: string;
  /**
   * Default value: "*"
   *
   * Used with configuring application cors libraries
   */
  public CORS?: string;
  /**
   * Lower limit for log levels
   */
  public LOG_LEVEL?: keyof typeof PinoLogger.prototype;
  /**
   * mongodb connection uri
   */
  public MONGO?: string;
  /**
   * 🤷‍♂️
   */
  public NODE_ENV?: string;
  /**
   * For binding http server
   */
  public PORT?: number;
  /**
   * Cache server
   */
  public REDIS_HOST?: string;
  /**
   * Cache server
   */
  public REDIS_PORT?: number;
  /**
   * Http request throttling (IP + route)
   */
  public THROTTLE_LIMIT?: number;
  /**
   * Http request throttling (IP + route)
   */
  public THROTTLE_TTL?: number;
  /**
   * Custom variables for implementations
   */
  public application?: Application;
  /**
   * Libraries
   */
  public libs?: {
    authentication?: AuthenticationConfig;
    ['formio-sdk']?: FormioSDKConfig;
    ['home-assistant']?: HomeAssistantConfig;
  };

  // #endregion Object Properties
}

import { Module } from '@nestjs/common';
import * as NestConfig from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { AutomagicalConfig } from '../typings';
import * as yaml from 'js-yaml';

@Module({})
export class ConfigModule {
  // #region Static Properties

  /**
   * This serves many libs, but realistically a running app will only ever have 1 config at a time.
   * It is stored here for easy access by anything that isn't using the config service.
   * Probably a bootstrapping process.
   */
  public static readonly config: Promise<AutomagicalConfig> = new Promise(
    (done) => (ConfigModule.done = done),
  );

  private static done;

  // #endregion Static Properties

  // #region Public Static Methods

  public static getConfig<T>(): Promise<AutomagicalConfig<T>> {
    return this.config as Promise<AutomagicalConfig<T>>;
  }

  public static register<
    T extends Record<never, unknown>,
    Arg extends AutomagicalConfig<T> = AutomagicalConfig<T>
  >(MergeConfig: Arg) {
    return NestConfig.ConfigModule.forRoot({
      isGlobal: true,
      load: [
        async () => {
          const config = {
            ...(await this.loadEnvFile()),
            ...MergeConfig,
          };
          ConfigModule.done(config);
          return config;
        },
      ],
    });
  }

  // #endregion Public Static Methods

  // #region Private Static Methods

  private static async loadEnvFile(): Promise<AutomagicalConfig> {
    const envFilePath = resolve(process.cwd(), 'user-env.yaml');
    if (existsSync(envFilePath)) {
      return yaml.load(readFileSync(envFilePath, 'utf-8')) as AutomagicalConfig;
    }
    return {};
  }

  // #endregion Private Static Methods
}

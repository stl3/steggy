/* eslint-disable @typescript-eslint/no-magic-numbers */

import { FetchService } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import { existsSync, readFileSync } from 'fs';

import { MongoConnectDTO } from '../contracts';

@Injectable()
export class ConnectService {
  constructor(private readonly fetchService: FetchService) {}

  public async buildConnectionUri(
    options: MongoConnectDTO,
  ): Promise<MongooseModuleOptions> {
    let sslCert: string;
    let sslKey: string;
    let sslValidate: boolean;
    let sslCRL: string[];
    let sslCA: string[];

    if (options.cert) {
      sslCert = await this.resolveUrl(options.cert);
    }
    if (options.key) {
      sslKey = await this.resolveUrl(options.key);
    }
    if (options.ca) {
      sslValidate = true;
      sslCA = await Promise.all(
        options.ca.map(async (item) => {
          return await this.resolveUrl(item);
        }),
      );
    }
    if (options.crl) {
      sslCRL = await Promise.all(
        options.crl.map(async (url) => {
          return await this.resolveUrl(url);
        }),
      );
    }

    return {
      connectTimeoutMS: 300000,
      socketTimeoutMS: 300000,
      sslCA,
      sslCRL,
      sslCert,
      sslKey,
      sslValidate,
      uri: options.uri,
      useCreateIndex: true,
      useNewUrlParser: true,
    };
  }

  private async resolveUrl(url: string): Promise<string> {
    if (url.slice(0, 4) === 'http') {
      return await this.fetchService.fetch({
        rawUrl: true,
        url,
      });
    }
    if (existsSync(url)) {
      return readFileSync(url, 'utf-8');
    }
    return url;
  }
}
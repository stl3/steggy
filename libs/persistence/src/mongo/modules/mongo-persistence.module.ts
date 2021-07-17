import {
  MONGO_CERTS,
  MONGO_CONFIG,
  MongoCerts,
} from '@formio/contracts/config';
import {
  ActionDTO,
  ActionItemDTO,
  FormDTO,
  ProjectDTO,
  RoleDTO,
  SchemaDTO,
  SessionDTO,
  SubmissionDTO,
  TagDTO,
  TokenDTO,
} from '@formio/contracts/formio-sdk';
import { FormioSdkModule } from '@formio/formio-sdk';
import { FetchService } from '@formio/utilities';
import { CacheModule, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ModelDefinition,
  MongooseModule,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import { existsSync, readFileSync } from 'fs';

import { EncryptionService } from '../../services/encryption.service';
import {
  ActionItemSchema,
  ActionSchema,
  FormSchema,
  ProjectSchema,
  RoleSchema,
  SchemaSchema,
  SessionSchema,
  SubmissionSchema,
  TagSchema,
  TokenSchema,
} from '../schema';
import {
  ActionItemPersistenceMongoService,
  ActionPersistenceMongoService,
  FormPersistenceMongoService,
  ProjectPersistenceMongoService,
  RolePersistenceMongoService,
  SchemaPersistenceMongoService,
  SessionPersistenceMongoService,
  SubmissionPersistenceMongoService,
  TagPersistenceMongoService,
  TokenPersistenceMongoService,
} from '../services';

const SchemaMap = new Map<string, ModelDefinition[]>(
  Object.entries({
    default: [
      { name: ActionItemDTO.name, schema: ActionItemSchema },
      { name: ActionDTO.name, schema: ActionSchema },
      { name: FormDTO.name, schema: FormSchema },
      { name: ProjectDTO.name, schema: ProjectSchema },
      { name: RoleDTO.name, schema: RoleSchema },
      { name: SessionDTO.name, schema: SessionSchema },
      { name: TagDTO.name, schema: TagSchema },
      { name: TokenDTO.name, schema: TokenSchema },
      { name: SchemaDTO.name, schema: SchemaSchema },
      { name: SubmissionDTO.name, schema: SubmissionSchema },
    ],
    submission: [],
  }),
);

const services = [
  ActionItemPersistenceMongoService,
  ActionPersistenceMongoService,
  FormPersistenceMongoService,
  ProjectPersistenceMongoService,
  RolePersistenceMongoService,
  SchemaPersistenceMongoService,
  SessionPersistenceMongoService,
  SubmissionPersistenceMongoService,
  TagPersistenceMongoService,
  TokenPersistenceMongoService,
  EncryptionService,
];
export class MongoPersistenceModule {
  // #region Public Static Methods

  public static async connectionOptions(
    configService: ConfigService,
    fetchService: FetchService,
  ): Promise<MongooseModuleOptions> {
    const config = {
      connectTimeoutMS: 300000,
      socketTimeoutMS: 300000,
      useCreateIndex: true,
      useNewUrlParser: true,
      ...configService.get(MONGO_CONFIG, {}),
    };
    const certs = configService.get<MongoCerts>(MONGO_CERTS, {});
    if (!certs) {
      return config;
    }
    if (certs.CA) {
      config.sslValidate = true;
      config.sslCA = await Promise.all(
        certs.CA.map(async (url) => {
          return await this.resolveUrl(url, fetchService);
        }),
      );
    }
    if (certs.CERT) {
      config.sslCert = await this.resolveUrl(certs.CERT, fetchService);
    }
    if (certs.CRL) {
      config.sslCRL = await Promise.all(
        certs.CRL.map(async (url) => {
          return await this.resolveUrl(url, fetchService);
        }),
      );
    }
    if (certs.KEY) {
      config.sslKey = await this.resolveUrl(certs.KEY, fetchService);
    }
    return config;
  }

  public static forFeature(): DynamicModule {
    const schemas: DynamicModule[] = [];
    SchemaMap.forEach((schemaList) => {
      schemas.push(MongooseModule.forFeature(schemaList));
    });
    return {
      exports: [...services, ...schemas],
      global: true,
      imports: [...schemas, CacheModule.register(), FormioSdkModule],
      module: MongoPersistenceModule,
      providers: [...services],
    };
  }

  public static forRoot(): DynamicModule {
    return MongooseModule.forRootAsync({
      connectionName: 'default',
      inject: [ConfigService, FetchService],
      useFactory(configService: ConfigService, fetchService: FetchService) {
        return MongoPersistenceModule.connectionOptions(
          configService,
          fetchService,
        );
      },
    });
  }

  // #endregion Public Static Methods

  // #region Private Static Methods

  private static async resolveUrl(
    url: string,
    fetchService: FetchService,
  ): Promise<string> {
    if (url.slice(0, 4) === 'http') {
      return await fetchService.fetch({
        rawUrl: true,
        url,
      });
    }
    if (existsSync(url)) {
      return readFileSync(url, 'utf-8');
    }
    return url;
  }

  // #endregion Private Static Methods
}

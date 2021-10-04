import {
  LIB_CONTROLLER_LOGIC,
  LibraryModule,
  RegisterCache,
} from '@automagical/utilities';
import { DynamicModule } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { DynamicRoomProviders, InjectedSettings } from '../decorators';
import { GroupRoomInterceptor } from '../interceptors';
import {
  CircadianService,
  FanGroupService,
  GroupService,
  KunamiCodeService,
  LightGroupService,
  LightManagerService,
  LockGroupService,
  MetaGroupService,
  RemoteAdapterService,
  RoomExplorerService,
  RoomManagerService,
  SolarCalcService,
  StateManagerService,
  SwitchGroupService,
} from '../services';
import { HomePersistenceModule } from './home-persistence.module';

const providers = [
  ...[
    FanGroupService,
    GroupService,
    LightGroupService,
    LockGroupService,
    MetaGroupService,
    SwitchGroupService,
  ],
  CircadianService,
  GroupRoomInterceptor,
  KunamiCodeService,
  LightManagerService,
  RemoteAdapterService,
  RoomExplorerService,
  RoomManagerService,
  SolarCalcService,
  StateManagerService,
];

@LibraryModule({
  exports: providers,
  imports: [RegisterCache(), DiscoveryModule, HomePersistenceModule],
  library: LIB_CONTROLLER_LOGIC,
  providers,
})
export class HomeControllerCustomModule {
  public static forRoot(): DynamicModule {
    const decorated = [
      ...DynamicRoomProviders.values(),
      ...InjectedSettings.values(),
    ];
    return {
      exports: [...providers, ...decorated],
      global: true,
      imports: [RegisterCache(), DiscoveryModule, HomePersistenceModule],
      module: HomeControllerCustomModule,
      providers: [...providers, ...decorated],
    };
  }
}

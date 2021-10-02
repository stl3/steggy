import { MainCLIModule } from '@automagical/tty';
import {
  APP_DEVTOOLS,
  ApplicationModule,
  UtilitiesModule,
} from '@automagical/utilities';
import { DiscoveryModule } from '@nestjs/core';

import {
  BaseDomainService,
  ChangelogService,
  ClimateService,
  ConfigBuilderService,
  EntityService,
  FanService,
  GroupCommandService,
  GroupStateService,
  HomeCommandService,
  HomeFetchService,
  ImgurAlbumDownloadService,
  LightService,
  LockService,
  MediaService,
  RoomCommandService,
  SwitchService,
} from '../services';

@ApplicationModule({
  application: APP_DEVTOOLS,
  imports: [
    ConfigBuilderService,
    DiscoveryModule,
    MainCLIModule,
    UtilitiesModule,
  ],
  providers: [
    ...[
      ...[
        BaseDomainService,
        ClimateService,
        FanService,
        LightService,
        LockService,
        MediaService,
        SwitchService,
      ],
      EntityService,
      GroupCommandService,
      GroupStateService,
      HomeCommandService,
      HomeFetchService,
      RoomCommandService,
    ],
    ...[ChangelogService, ConfigBuilderService],
    ...[ImgurAlbumDownloadService],
  ],
})
export class DevtoolsModule {}

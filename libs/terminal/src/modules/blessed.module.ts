import { SCREEN_TITLE } from '@automagical/contracts/config';
import { LIB_TERMINAL } from '@automagical/contracts/constants';
import {
  BLESSED_GRID,
  BLESSED_SCREEN,
  BLESSED_THEME,
  Grid,
  Screen,
} from '@automagical/contracts/terminal';
import { AutoConfigService, LibraryModule } from '@automagical/utilities';
import { DynamicModule, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { RefreshAfter } from '../decorators';
import { WorkspaceExplorerService } from '../services';

@LibraryModule({
  exports: [BlessedModule],
  library: LIB_TERMINAL,
  providers: [BlessedModule],
})
export class BlessedModule {
  // #region Public Static Methods

  public static forRoot(BLESSED_COLORS: unknown): DynamicModule {
    const symbols = [
      WorkspaceExplorerService,
      {
        inject: [AutoConfigService],
        provide: BLESSED_SCREEN,
        useFactory(config: AutoConfigService) {
          const out = Screen({
            autoPadding: true,
            smartCSR: true,
            title: config.get(SCREEN_TITLE),
          });
          // eventEmitter.on
          RefreshAfter.setEmitter(() => {
            out.render();
          });
          return out;
        },
      },
      {
        provide: BLESSED_THEME,
        useValue: BLESSED_COLORS,
      },
      {
        inject: [BLESSED_SCREEN],
        provide: BLESSED_GRID,
        useFactory(screen: Screen) {
          return new Grid({
            // Bad typescript definitions
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            color: 'white',
            cols: 12,
            rows: 12,
            screen,
          });
        },
      },
    ] as Provider[];
    return {
      exports: symbols,
      global: true,
      imports: [DiscoveryModule],
      module: BlessedModule,
      providers: symbols,
    };
  }

  // #endregion Public Static Methods
}

import { HassEventDTO } from '@automagical/contracts/home-assistant';
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { box as Box, Widgets } from 'blessed';
import { grid as Grid } from 'blessed-contrib';
import { Cache } from 'cache-manager';

import { BLESSED_SCREEN } from '../typings';

// const BOX_SETTINGS: Widgets.BoxOptions = {
//   alwaysScroll: true,
//   keys: true,
//   scrollable: true,
//   scrollbar: {
//     style: {
//       bg: 'yellow',
//     },
//   },
//   tags: true,
//   valign: 'bottom',
// };

@Injectable()
export class StatusService {
  // #region Object Properties

  private WIDGET: Widgets.BoxElement;

  // #endregion Object Properties

  // #region Constructors

  constructor(
    @Inject(BLESSED_SCREEN) private readonly SCREEN: Widgets.Screen,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  // #endregion Constructors

  // #region Public Methods

  public async attachInstance(grid: Grid): Promise<void> {
    this.WIDGET = grid.set(0, 0, 3, 1, Box, {
      label: 'Quick Status',
    });
    const cache = await this.cacheManager.get<HassEventDTO[]>(CACHE_KEY);
    cache.forEach((event) => {
      this.WIDGET.insertLine(0, this.buildLine(event));
    });
    this.SCREEN.render();
  }

  // #endregion Public Methods

  // #region Private Methods

  private buildLine(event: HassEventDTO): string {
    return event.data.entity_id;
  }

  // #endregion Private Methods
}
const CACHE_KEY = StatusService.name;

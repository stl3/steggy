import {
  GENERIC_COMMANDS,
  GroupDTO,
  RoutineCommandGroupActionDTO,
} from '@ccontour/controller-logic';
import { ICONS, PromptEntry, PromptService } from '@ccontour/tty';
import { AutoLogService } from '@ccontour/utilities';
import { Injectable } from '@nestjs/common';

import { HomeFetchService } from '../home-fetch.service';

@Injectable()
export class SwitchGroupCommandService {
  constructor(
    private readonly promptService: PromptService,
    private readonly fetchService: HomeFetchService,
    private readonly logger: AutoLogService,
  ) {}

  public async commandBuilder(
    current?: string,
  ): Promise<Omit<RoutineCommandGroupActionDTO, 'group'>> {
    const command = await this.promptService.pickOne(
      `Light group action`,
      [
        [`${ICONS.TURN_ON}Turn On`, 'turnOn'],
        [`${ICONS.TURN_OFF}Turn Off`, 'turnOff'],
        [`${ICONS.TOGGLE_OFF}Toggle`, 'toggle'],
      ] as PromptEntry<GENERIC_COMMANDS>[],
      current,
    );
    return { command };
  }

  public async groupActions(): Promise<PromptEntry[]> {
    return await [
      [`${ICONS.TURN_ON}Turn On`, 'turnOn'],
      [`${ICONS.TURN_OFF}Turn Off`, 'turnOff'],
      [`${ICONS.TOGGLE_OFF}Toggle`, 'toggle'],
    ];
  }

  public async processAction(group: GroupDTO, action: string): Promise<void> {
    switch (action) {
      case 'toggle':
        return await this.toggle(group);
      case 'turnOn':
        return await this.turnOn(group);
      case 'turnOff':
        return await this.turnOff(group);
    }
    this.logger.error({ action }, `Unknown action`);
  }

  public async toggle(group: GroupDTO | string): Promise<void> {
    group = typeof group === 'string' ? group : group._id;
    await this.fetchService.fetch({
      method: 'put',
      url: `/group/${group}/command/toggle`,
    });
  }

  public async turnOff(group: GroupDTO | string): Promise<void> {
    group = typeof group === 'string' ? group : group._id;
    await this.fetchService.fetch({
      method: 'put',
      url: `/group/${group}/command/turnOff`,
    });
  }

  public async turnOn(group: GroupDTO | string): Promise<void> {
    group = typeof group === 'string' ? group : group._id;
    await this.fetchService.fetch({
      method: 'put',
      url: `/group/${group}/command/turnOn`,
    });
  }
}

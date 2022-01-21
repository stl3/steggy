import { Injectable, NotImplementedException } from '@nestjs/common';
import { AutoLogService } from '@text-based/boilerplate';
import {
  GROUP_LIGHT_COMMANDS,
  GROUP_TYPES,
  GroupCommandDTO,
  GroupDTO,
  GroupLightCommandExtra,
  LIGHTING_MODE,
  LightingCacheDTO,
  RoomEntitySaveStateDTO,
} from '@text-based/controller-shared';
import { EntityManagerService } from '@text-based/home-assistant';
import {
  domain,
  HASS_DOMAINS,
  LightStateDTO,
} from '@text-based/home-assistant-shared';
import { each } from '@text-based/utilities';

import { LightManagerService } from '../lighting';
import { GroupPersistenceService } from '../persistence';
import { BaseGroupService } from './base-group.service';

type GroupParameter = GroupDTO<LightingCacheDTO> | string;
const START = 0;

/**
 * Light groups are intended to work with just light domain devices
 */
@Injectable()
export class LightGroupService extends BaseGroupService {
  constructor(
    protected readonly logger: AutoLogService,
    protected readonly groupPersistence: GroupPersistenceService,
    private readonly entityManager: EntityManagerService,
    private readonly lightManager: LightManagerService,
  ) {
    super();
  }

  public readonly GROUP_TYPE = GROUP_TYPES.light;

  public async activateCommand(
    group: GroupParameter,
    command: GroupCommandDTO<GroupLightCommandExtra, GROUP_LIGHT_COMMANDS>,
  ): Promise<void> {
    switch (command.command) {
      case 'turnOff':
        return await this.turnOff(group);
      case 'turnOn':
        return await this.turnOn(group, false, command.extra?.brightness);
      case 'circadianOn':
        return await this.turnOn(group, true, command.extra?.brightness);
      case 'dimDown':
        return await this.dimDown(group, command.extra?.brightness);
      case 'dimUp':
        return await this.dimUp(group, command.extra?.brightness);
      default:
        throw new NotImplementedException();
    }
  }

  public async dimDown(group: GroupParameter, amount?: number): Promise<void> {
    group = await this.loadGroup(group);
    await this.lightManager.dimDown({ increment: amount }, group.entities);
  }

  public async dimUp(group: GroupParameter, amount?: number): Promise<void> {
    group = await this.loadGroup(group);
    await this.lightManager.dimUp({ increment: amount }, group.entities);
  }

  public async expandState(
    group: GroupDTO | string,
    { brightness, hs_color, rgb_color }: LightingCacheDTO,
  ): Promise<void> {
    group = await this.loadGroup(group);
    await each(group.entities, async entity => {
      if (!hs_color && !rgb_color) {
        await this.lightManager.setAttributes(entity, {
          brightness,
        });
        return;
      }
      await this.lightManager.turnOn(entity, {
        brightness,
        hs_color,
        rgb_color,
      });
    });
  }

  public async getState(
    group: GroupDTO<LightingCacheDTO>,
  ): Promise<RoomEntitySaveStateDTO<LightingCacheDTO>[]> {
    const out: RoomEntitySaveStateDTO<LightingCacheDTO>[] = [];
    await each(group.entities, async id => {
      const light = this.entityManager.getEntity<LightStateDTO>(id);
      if (!light) {
        // 100% of the time this error is seen, bad times were a pre-existing condition
        this.logger.error(`[${group.friendlyName}] missing entity {${id}}`);
        return;
      }
      const state = await this.lightManager.getState(id);
      out.push({
        extra:
          state?.mode === LIGHTING_MODE.circadian
            ? {
                brightness: light.attributes.brightness,
                mode: LIGHTING_MODE.circadian,
              }
            : {
                brightness: light.attributes.brightness,
                hs_color: light.attributes.hs_color,
                rgb_color: light.attributes.rgb_color,
              },
        ref: light.entity_id,
        state: light.state,
      });
    });
    return out;
  }

  public isValidEntity(id: string): boolean {
    return domain(id) === HASS_DOMAINS.light;
  }

  public async rotateColors(
    group: GroupParameter,
    direction: 'forward' | 'reverse' = 'forward',
  ): Promise<void> {
    group = await this.loadGroup(group);
    const states = await this.getState(group);
    if (direction === 'forward') {
      states.unshift(states.pop());
    } else {
      states.push(states.shift());
    }
    await this.setState(group.entities, states);
  }

  /**
   * Set brightness for turned on entities of the group
   */

  public async setBrightness(
    group: GroupParameter,
    brightness: number,
    turnOn = false,
  ): Promise<void> {
    group = await this.loadGroup(group);
    const states = this.getState(group);
    await each(
      group.entities.map((entity, index) => {
        return [entity, states[index]];
      }) as [string, RoomEntitySaveStateDTO<LightingCacheDTO>][],
      async ([id, state]) => {
        if (state?.state !== 'on' && turnOn === false) {
          return;
        }
        await this.lightManager.setAttributes(id, { brightness });
      },
    );
  }

  public async setState(
    entites: string[],
    state: RoomEntitySaveStateDTO[],
  ): Promise<void> {
    if (entites.length !== state.length) {
      this.logger.warn(`State and entity length mismatch`);
      state = state.slice(START, entites.length);
    }
    await each(
      state.map((state, index) => {
        return [entites[index], state];
      }) as [string, RoomEntitySaveStateDTO<LightingCacheDTO>][],
      async ([id, state]) => {
        if (state.state === 'off') {
          await this.lightManager.turnOff(id);
          return;
        }
        switch (state.extra.mode) {
          case LIGHTING_MODE.circadian:
            await this.lightManager.circadianLight(id, state.extra.brightness);
            break;
          case LIGHTING_MODE.on:
          default:
            await this.lightManager.turnOn(id, {
              brightness: state.extra.brightness,
              hs_color: state.extra.hs_color,
            });
            break;
        }
      },
    );
  }

  public async turnOff(group: GroupParameter): Promise<void> {
    group = await this.loadGroup(group);
    await this.lightManager.turnOff(group.entities);
  }

  public async turnOn(
    group: GroupParameter,
    circadian = false,
    brightness?: number,
  ): Promise<void> {
    group = await this.loadGroup(group);
    if (circadian) {
      await this.lightManager.circadianLight(group.entities, brightness);
      return;
    }
    await this.lightManager.turnOn(group.entities, {
      brightness,
    });
  }
}

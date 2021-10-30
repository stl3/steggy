import {
  LightingCacheDTO,
  RoomEntitySaveStateDTO,
} from '@automagical/controller-logic';
import { HASS_DOMAINS, LightStateDTO } from '@automagical/home-assistant';
import { PromptEntry } from '@automagical/tty';
import { Injectable } from '@nestjs/common';
import inquirer from 'inquirer';

import { SwitchService } from './switch.service';

const START = 0;
const SHIFT_AMOUNT = 2;

@Injectable()
export class LightService extends SwitchService {
  public async circadianLight(id: string): Promise<void> {
    return await this.fetchService.fetch({
      method: 'put',
      url: `/entity/command/${id}/circadianLight`,
    });
  }

  public async createSaveState(
    entity_id: string,
    current?: RoomEntitySaveStateDTO<LightingCacheDTO>,
  ): Promise<RoomEntitySaveStateDTO> {
    const state = await this.promptService.pickOne(
      entity_id,
      [
        ['Turn On', 'turnOn'],
        ['Turn Off', 'turnOff'],
        ['Circadian Light', 'circadianLight'],
      ],
      current?.state,
    );
    if (state === 'turnOff') {
      return {
        ref: entity_id,
        state,
      };
    }
    let brightness: number;
    if (
      await this.promptService.confirm(
        `Set brightness? (default is previous value)`,
      )
    ) {
      brightness = await this.promptService.number(
        `Set brightness (1-255)`,
        current?.extra?.brightness,
      );
    }
    return {
      ref: entity_id,
      extra: { brightness },
      state,
    };
  }

  public async dimDown(id: string): Promise<void> {
    return await this.fetchService.fetch({
      method: 'put',
      url: `/entity/command/${id}/dimDown`,
    });
  }

  public async dimUp(id: string): Promise<void> {
    return await this.fetchService.fetch({
      method: 'put',
      url: `/entity/command/${id}/dimUp`,
    });
  }

  public async processId(id: string, command?: string): Promise<string> {
    await this.header(id);
    const action = await super.processId(id, command);
    switch (action) {
      case 'dimDown':
        await this.dimDown(id);
        return await this.processId(id, action);
      case 'dimUp':
        await this.dimUp(id);
        return await this.processId(id, action);
      case 'circadianLight':
        await this.circadianLight(id);
        return await this.processId(id, action);
      case 'swapState':
        await this.swapState(id);
        return await this.processId(id, action);
    }
    return action;
  }

  public async swapState(id: string, withinList?: string[]): Promise<void> {
    const state = await this.getState<LightStateDTO>(id);
    const swapWith = await this.pickFromDomain<LightStateDTO>(
      HASS_DOMAINS.light,
      withinList,
    );
    await this.setState(swapWith.entity_id, {
      brightness: state.attributes.brightness,
      hs_color: state.attributes.hs_color,
    });
    await this.setState(state.entity_id, {
      brightness: swapWith.attributes.brightness,
      hs_color: swapWith.attributes.hs_color,
    });
  }

  protected getMenuOptions(): PromptEntry[] {
    const parent = super.getMenuOptions();
    return [
      ...parent.slice(START, SHIFT_AMOUNT),
      ['Circadian light', 'circadianLight'],
      ['Dim Up', 'dimUp'],
      ['Dim Down', 'dimDown'],
      ['Swap state with another light', 'swapState'],
      ...parent.slice(SHIFT_AMOUNT),
    ];
  }

  protected async header(id: string): Promise<void> {
    const content = await this.baseHeader<LightStateDTO>(id);
    console.log(
      [
        `Entity id: ${content.entity_id}`,
        `State: ${content.state}`,
        ...(content.state === 'on'
          ? [
              `Brightness: ${content.attributes.brightness}`,
              `RGB: [${content.attributes.rgb_color?.join(', ')}]`,
              `HS: [${content.attributes.hs_color?.join(', ')}]`,
            ]
          : []),
        ``,
      ].join(`\n`),
    );
  }

  private async setState(
    id: string,
    body: Partial<LightingCacheDTO>,
  ): Promise<void> {
    await this.fetchService.fetch({
      body,
      method: 'put',
      url: `/entity/light-state/${id}`,
    });
  }
}

import { HASS_DOMAINS } from '@automagical/contracts/home-assistant';
import { Trace } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';

import { HACallService } from '../services';

@Injectable()
export class HumidifierDomain {
  // #region Constructors

  constructor(private readonly callService: HACallService) {
    callService.domain = HASS_DOMAINS.humidifier;
  }

  // #endregion Constructors

  // #region Public Methods

  @Trace()
  public async setHumidity(entityId: string, humidity: number): Promise<void> {
    await this.callService.call('set_humidity', {
      entity_id: entityId,
      humidity,
    });
  }

  @Trace()
  public async setMode(entityId: string, mode: string): Promise<void> {
    await this.callService.call('set_mode', {
      entity_id: entityId,
      mode,
    });
  }

  @Trace()
  public async toggle(entityId: string | string[]): Promise<void> {
    return await this.callService.call('toggle', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async turnOff(entityId: string | string[]): Promise<void> {
    return await this.callService.call('turn_off', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async turnOn(entityId: string | string[]): Promise<void> {
    return await this.callService.call('turn_on', {
      entity_id: entityId,
    });
  }

  // #endregion Public Methods
}
import { Trace } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';

import { HASS_DOMAINS } from '../contracts';
import { HACallService } from '../services';

@Injectable()
export class HomeAssistantCoreService {
  constructor(private readonly callService: HACallService) {
    this.callService.domain = HASS_DOMAINS.homeassistant;
  }

  @Trace()
  public async checkConfig(): Promise<void> {
    await this.callService.call('check_config');
  }

  @Trace()
  public async reloadCoreConfig(): Promise<void> {
    await this.callService.call('reload_core_config');
  }

  @Trace()
  public async reloadconfigEntry(): Promise<void> {
    await this.callService.call('reload_config_entry');
  }

  @Trace()
  public async restart(): Promise<void> {
    await this.callService.call('restart');
  }

  @Trace()
  public async setLocation(latitude: number, longitude: number): Promise<void> {
    await this.callService.call('set_location', { latitude, longitude });
  }

  @Trace()
  public async stop(): Promise<void> {
    await this.callService.call('stop');
  }

  @Trace()
  public async toggle(entityId: string | string[]): Promise<void> {
    await this.callService.call('toggle', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async turnOff(entityId: string | string[]): Promise<void> {
    await this.callService.call('turn_off', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async turnOn(entityId: string | string[]): Promise<void> {
    await this.callService.call('turn_on', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async updateEntitiy(entityIds: string[]): Promise<void> {
    await this.callService.call('update_entity', {
      entity_id: entityIds,
    });
  }
}

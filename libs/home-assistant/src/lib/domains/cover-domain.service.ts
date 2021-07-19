import { LIB_HOME_ASSISTANT } from '@automagical/contracts/constants';
import { HASS_DOMAINS } from '@automagical/contracts/home-assistant';
import { InjectLogger, Trace } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { HACallService } from '../services';

/**
 * https://www.home-assistant.io/integrations/cover/
 */
@Injectable()
export class CoverDomainService {
  // #region Constructors

  constructor(
    @InjectLogger(CoverDomainService, LIB_HOME_ASSISTANT)
    private readonly logger: PinoLogger,
    private readonly callService: HACallService,
  ) {
    callService.domain = HASS_DOMAINS.cover;
  }

  // #endregion Constructors

  // #region Public Methods

  @Trace()
  public async close(entityId: string): Promise<void> {
    return await this.callService.call('close_cover', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async closeCoverTilt(entityId: string): Promise<void> {
    return await this.callService.call('close_cover_tilt', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async open(entityId: string): Promise<void> {
    return await this.callService.call('open_cover', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async openCoverTilt(entityId: string): Promise<void> {
    return await this.callService.call('open_cover_tilt', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async stop(entityId: string): Promise<void> {
    return await this.callService.call('stop_cover', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async stopCoverTilt(entityId: string): Promise<void> {
    return await this.callService.call('stop_cover_tilt', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async toggle(entityId: string): Promise<void> {
    return await this.callService.call('toggle', {
      entity_id: entityId,
    });
  }

  @Trace()
  public async toggleTilt(entityId: string): Promise<void> {
    return await this.callService.call('toggle_tilt', {
      entity_id: entityId,
    });
  }

  // #endregion Public Methods
}

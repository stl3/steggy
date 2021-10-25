import {
  HomeAssistantCoreService,
  LightDomainService,
} from '@automagical/home-assistant';
import {
  AutoLogService,
  CacheManagerService,
  InjectCache,
  InjectConfig,
  InjectLogger,
  IsEmpty,
  Trace,
} from '@automagical/utilities';
import { Injectable } from '@nestjs/common';
import { each } from 'async';
import { EventEmitter2 } from 'eventemitter2';

import { MAX_BRIGHTNESS, MIN_BRIGHTNESS } from '../config';
import { DIM_PERCENT } from '../config';
import {
  CIRCADIAN_UPDATE,
  LIGHTING_MODE,
  LightingCacheDTO,
} from '../contracts';
import { RoomCommandDTO } from '../contracts/rooms/room-command.dto';
import { CircadianService } from './circadian.service';

const LIGHTING_CACHE_PREFIX = 'LIGHTING:';
const CACHE_KEY = (entity) => `${LIGHTING_CACHE_PREFIX}${entity}`;
const INVERT_VALUE = -1;
const PERCENT = 100;
const DEFAULT_INCREMENT = 1;
const START = 0;
const NO_BRIGHTNESS = 0;

/**
 * - State management for lights
 * - Forwards commands to light domain service
 * - Management of the light temperature for lights flagged as circadian mode
 */
@Injectable()
export class LightManagerService {
  constructor(
    @InjectCache() private readonly cache: CacheManagerService,
    private readonly hassCoreService: HomeAssistantCoreService,
    private readonly lightService: LightDomainService,
    @InjectLogger()
    private readonly logger: AutoLogService,
    private readonly circadianService: CircadianService,
    private readonly eventEmitter: EventEmitter2,
    @InjectConfig(DIM_PERCENT) private readonly dimPercent: number,
    @InjectConfig(MAX_BRIGHTNESS) private readonly maxBrightness: number,
    @InjectConfig(MIN_BRIGHTNESS) private readonly minBrightness: number,
  ) {}

  @Trace()
  public async circadianLight(
    entity_id: string | string[] = [],
    brightness?: number,
  ): Promise<void> {
    if (Array.isArray(entity_id)) {
      await each(entity_id, async (id, callback) => {
        await this.circadianLight(id, brightness);
        callback();
      });
      return;
    }
    await this.setAttributes(entity_id, {
      brightness,
      mode: LIGHTING_MODE.circadian,
    });
  }

  @Trace()
  public async dimDown(
    data: RoomCommandDTO = {},
    change: string[],
  ): Promise<void> {
    const { increment = DEFAULT_INCREMENT } = data;
    const lights = await this.findDimmableLights(change);
    await each(lights, async (entity_id: string, callback) => {
      await this.lightDim(
        entity_id,
        this.dimPercent * increment * INVERT_VALUE,
      );
      callback();
    });
  }

  @Trace()
  public async dimUp(
    data: RoomCommandDTO = {},
    change: string[],
  ): Promise<void> {
    const { increment = DEFAULT_INCREMENT } = data;
    const lights = await this.findDimmableLights(change);
    await each(lights, async (entity_id: string, callback) => {
      await this.lightDim(entity_id, this.dimPercent * increment);
      callback();
    });
  }

  @Trace()
  public async findDimmableLights(change: string[]): Promise<string[]> {
    const lights = await this.getActiveLights();
    return change.filter((light) => lights.includes(light));
  }

  /**
   * Retrieve a list of lights that are supposed to be turned on right now
   */
  @Trace()
  public async getActiveLights(): Promise<string[]> {
    const list: string[] = await this.cache.store.keys();
    return list
      .filter(
        (item) =>
          item.slice(START, LIGHTING_CACHE_PREFIX.length) ===
          LIGHTING_CACHE_PREFIX,
      )
      .map((item) => item.slice(LIGHTING_CACHE_PREFIX.length));
  }

  @Trace()
  public async getState(entity_id: string): Promise<LightingCacheDTO> {
    return await this.cache.get(CACHE_KEY(entity_id));
  }

  /**
   * Brightness (as controlled by the dimmer) must remain in the 5-100% range
   *
   * To go under 5, turn off the light instead
   */
  @Trace()
  public async lightDim(entityId: string, amount: number): Promise<void> {
    let { brightness = NO_BRIGHTNESS } = await this.getState(entityId);
    brightness += amount;
    if (brightness > this.maxBrightness) {
      brightness = this.maxBrightness;
    }
    if (brightness < this.minBrightness) {
      brightness = this.minBrightness;
    }
    this.logger.debug(
      { amount },
      `${entityId} set brightness: ${brightness}/${
        this.maxBrightness
      } (${Math.floor((brightness * PERCENT) / this.maxBrightness)}%)`,
    );
    return await this.circadianLight(entityId, brightness);
  }

  @Trace()
  public async setAttributes(
    entity_id: string | string[],
    settings: Partial<LightingCacheDTO> = {},
  ): Promise<void> {
    if (settings.kelvin && settings.hs_color) {
      this.logger.warn(
        { entity_id, settings },
        `Both kelvin and hs color provided`,
      );
    }
    if (Array.isArray(entity_id)) {
      await each(entity_id, async (id, callback) => {
        await this.setAttributes(id, settings);
        callback();
      });
      return;
    }
    const current =
      (await this.getState(entity_id)) ?? ({} as LightingCacheDTO);
    // if the incoming mode is circadian
    // or there is no mode defined, and the current one is circadian
    if (
      settings.mode === LIGHTING_MODE.circadian ||
      (IsEmpty(settings.mode) && current?.mode === LIGHTING_MODE.circadian)
    ) {
      settings.kelvin = await this.circadianService.CURRENT_LIGHT_TEMPERATURE;
      settings.mode = LIGHTING_MODE.circadian;
      settings.brightness ??= current.brightness;
    } else {
      delete settings.kelvin;
      delete current.kelvin;
    }
    const key = CACHE_KEY(entity_id);

    await this.cache.set(key, settings);
    // Brightness here is 1-255
    const data = {
      brightness: settings.brightness,
      hs_color: settings.hs_color,
      kelvin: settings.kelvin,
    };
    Object.keys(data).forEach((key) => {
      if (typeof data[key] === 'undefined') {
        delete data[key];
      }
    });
    // this.logger.debug({ data, settings }, entity_id);
    await this.lightService.turnOn(entity_id, data);
  }

  @Trace()
  public async turnOff(entity_id: string | string[]): Promise<void> {
    return this.turnOffEntities(entity_id);
  }

  public async turnOffEntities(entity_id: string | string[]): Promise<void> {
    if (Array.isArray(entity_id)) {
      each(entity_id, async (entity, callback) => {
        await this.turnOffEntities(entity);
        callback();
      });
      return;
    }
    await this.cache.del(CACHE_KEY(entity_id));
    await this.hassCoreService.turnOff(entity_id);
  }

  @Trace()
  public async turnOn(
    entity_id: string | string[],
    settings: Partial<LightingCacheDTO> = {},
  ): Promise<void> {
    return this.setAttributes(entity_id, {
      ...settings,
      mode: LIGHTING_MODE.on,
    });
  }

  @Trace()
  protected async circadianLightingUpdate(kelvin: number): Promise<void> {
    const lights = await this.getActiveLights();
    await each(lights, async (id, callback) => {
      const state = await this.getState(id);
      if (state?.mode !== 'circadian') {
        // if (state?.mode !== 'circadian' || state.kelvin === kelvin) {
        return;
      }
      await this.setAttributes(id, { kelvin });
      callback();
    });
  }

  @Trace()
  protected onModuleInit(): void {
    this.eventEmitter.on(CIRCADIAN_UPDATE, (kelvin) =>
      this.circadianLightingUpdate(kelvin),
    );
  }
}

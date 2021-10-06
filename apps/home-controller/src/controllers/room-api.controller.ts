import type {
  iRoomController,
  RoomInspectResponseDTO,
} from '@automagical/controller-logic';
import {
  RoomCommandDTO,
  RoomControllerSettingsDTO,
  RoomInstancePipe,
  RoomManagerService,
  RoomSettingsPipe,
} from '@automagical/controller-logic';
import {
  EntityManagerService,
  FanDomainService,
  FanSpeeds,
  MediaPlayerDomainService,
} from '@automagical/home-assistant';
import {
  AuthStack,
  EnumContainsPipe,
  GENERIC_SUCCESS_RESPONSE,
} from '@automagical/server';
import { AutoLogService } from '@automagical/utilities';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  ValidationPipe,
} from '@nestjs/common';

@Controller(`/room`)
@AuthStack()
export class RoomAPIController {
  constructor(
    private readonly logger: AutoLogService,
    private readonly roomManager: RoomManagerService,
    private readonly fanDomain: FanDomainService,
    private readonly mediaPlayerService: MediaPlayerDomainService,
    private readonly entityService: EntityManagerService,
  ) {}

  /**
   * Turn off all the lights for the room
   */
  @Put('/:name/areaOff')
  public async areaOff(
    @Param('name', RoomSettingsPipe) settings: RoomControllerSettingsDTO,
    @Body(ValidationPipe) body: RoomCommandDTO,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.roomManager.areaOff(settings, body);
    this.logger.info({ body }, `[${settings.friendlyName}] areaOff`);
    return GENERIC_SUCCESS_RESPONSE;
  }

  /**
   * Turn on all the lights fro the room
   */
  @Put('/:name/areaOn')
  public async areaOn(
    @Param('name', RoomSettingsPipe) settings: RoomControllerSettingsDTO,
    @Body(ValidationPipe) body: RoomCommandDTO,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.roomManager.areaOn(settings, body);
    this.logger.info({ body }, `[${settings.friendlyName}] areaOn`);
    return GENERIC_SUCCESS_RESPONSE;
  }

  /**
   * Activate the favorite command if available
   */
  @Put('/:name/favorite')
  public async favorite(
    @Param('name', RoomInstancePipe) instance: iRoomController,
    @Param('name', RoomSettingsPipe)
    { friendlyName }: RoomControllerSettingsDTO,
    @Body(ValidationPipe) body: RoomCommandDTO,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    if (!instance.favorite) {
      throw new BadRequestException(`Room does not support command`);
    }
    await instance.favorite(body);
    this.logger.info({ body }, `[${friendlyName}] favorite`);
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Get('/:name/inspect')
  public async inspectRoom(
    @Param('name', RoomSettingsPipe) settings: RoomControllerSettingsDTO,
  ): Promise<RoomInspectResponseDTO> {
    const entities = [
      ...(settings.lights || []),
      ...(settings.switches || []),
      ...(settings.accessories || []),
      settings.media,
      settings.fan,
    ].filter((item) => typeof item === 'string');
    const groups = settings.groups ?? {};
    Object.keys(groups).map((group) => {
      return entities.push(...settings.groups[group]);
    });
    return {
      groups,
      states: await this.entityService.getEntity(
        entities.filter((item, index) => {
          return entities.indexOf(item) === index;
        }),
      ),
    };
  }

  /**
   * List the available metadata for all rooms
   */
  @Get('/list')
  public listRooms(): RoomControllerSettingsDTO[] {
    return [...this.roomManager.settings.values()];
  }

  /**
   * Set the room's fan speed (if fan is available)
   */
  @Put('/:name/fan/:speed')
  public async setFan(
    @Param('name', RoomSettingsPipe) settings: RoomControllerSettingsDTO,
    @Param('speed', new EnumContainsPipe(FanSpeeds)) speed: FanSpeeds,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    if (!settings.fan) {
      throw new BadRequestException(`Room does not have a registered fan`);
    }
    if (!Object.values(FanSpeeds).includes(speed)) {
      throw new BadRequestException(`Bad fan speed ${speed}`);
    }
    this.logger.info({ speed }, `[${settings.friendlyName}] set fan`);
    await this.fanDomain.setFan(settings.fan, speed);
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Put('/:name/media/:state')
  public async setMediaState(
    @Param('name', RoomSettingsPipe) { media }: RoomControllerSettingsDTO,
    @Param('state') state: string,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    if (!media) {
      throw new BadRequestException(
        `Room does not have a registered meda device`,
      );
    }
    switch (state) {
      case 'turnOn':
        await this.mediaPlayerService.turnOn(media);
        break;
      case 'turnOff':
        await this.mediaPlayerService.turnOff(media);
        break;
      case 'playPause':
        await this.mediaPlayerService.playPause(media);
        break;
    }
    return GENERIC_SUCCESS_RESPONSE;
  }
}
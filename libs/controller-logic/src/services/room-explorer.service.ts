import {
  ControllerStates,
  iRoomController,
  ROOM_COMMAND,
  ROOM_CONTROLLER_SETTINGS,
  RoomControllerParametersDTO,
  RoomControllerSettingsDTO,
} from '@automagical/contracts/controller-logic';
import {
  AutoLogService,
  InjectLogger,
  PEAT,
  Trace,
} from '@automagical/utilities';
import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { LightManagerService } from './light-manager.service';
import { RemoteAdapterService } from './remote-adapter.service';

/**
 * This service searches through all the declared providers looking for rooms.
 * When one is found, secondary classes such as state management and lighting controllers are added.
 * Additionally, this service performs injection on specifically annotated properties
 */
@Injectable()
export class RoomExplorerService {
  // #region Object Properties

  public readonly rooms = new Set<InstanceWrapper<iRoomController>>();

  // #endregion Object Properties

  // #region Constructors

  constructor(
    @InjectLogger()
    private readonly logger: AutoLogService,
    private readonly discoveryService: DiscoveryService,
    private readonly remoteAdapter: RemoteAdapterService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // #endregion Constructors

  // #region Public Methods

  public getSettings({ instance }: InstanceWrapper): RoomControllerSettingsDTO {
    const constructor = instance?.constructor ?? {};
    return constructor[ROOM_CONTROLLER_SETTINGS];
  }

  // #endregion Public Methods

  // #region Protected Methods

  @Trace()
  protected onModuleInit(): void {
    this.logger.info(`Loading rooms`);
    const providers: InstanceWrapper<iRoomController>[] =
      this.discoveryService.getProviders();
    providers.forEach(async (wrapper) => {
      const settings = this.getSettings(wrapper);
      if (!settings) {
        return;
      }
      this.rooms.add(wrapper);
      const { instance } = wrapper;
      // TODO: hacktacular!
      instance.lightManager['room'] = instance;
      instance.kunamiService['room'] = instance;
      this.remoteAdapter.watch(settings.remote);
      if (!settings.omitRoomEvents) {
        this.controllerDefaults(instance);
        this.roomToRoomEvents(settings, instance);
      }
      this.logger.info(`[${settings.friendlyName}] initialized`);
    });
  }

  // #endregion Protected Methods

  // #region Private Methods

  private controllerDefaults(instance: iRoomController): void {
    const list = [
      [ControllerStates.off, 'areaOff'],
      [ControllerStates.on, 'areaOn'],
      [ControllerStates.down, 'dimDown'],
      [ControllerStates.up, 'dimUp'],
    ] as [ControllerStates, keyof LightManagerService][];
    PEAT(2).forEach((count) => {
      list.forEach(([state, method]) => {
        instance.kunamiService.addCommand({
          activate: {
            ignoreRelease: true,
            states: PEAT(count).map(() => state),
          },
          callback: () => {
            instance.lightManager[method]({ count });
          },
          name: `Quick ${method} (${count})`,
        });
      });
    });
  }

  private roomToRoomEvents(
    { name }: RoomControllerSettingsDTO,
    instance: iRoomController,
  ): void {
    this.eventEmitter.on(
      ROOM_COMMAND(name, 'areaOff'),
      (parameters: RoomControllerParametersDTO) => {
        instance.lightManager.areaOff(parameters);
      },
    );
    this.eventEmitter.on(
      ROOM_COMMAND(name, 'areaOn'),
      (parameters: RoomControllerParametersDTO) => {
        instance.lightManager.areaOn(parameters);
      },
    );
  }

  // #endregion Private Methods
}
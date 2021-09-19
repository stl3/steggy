import {
  AutoLogService,
  InjectLogger,
  ModuleScannerService,
  MqttService,
  PEAT,
  SEND_ROOM_STATE,
  Trace,
} from '@automagical/utilities';
import { Injectable, RequestMethod } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

import {
  ControllerStates,
  iRoomController,
  iRoomControllerMethods,
  ROOM_API_COMMAND,
  ROOM_COMMAND,
  ROOM_CONTROLLER_SETTINGS,
  RoomControllerParametersDTO,
  RoomControllerSettingsDTO,
} from '../contracts';
import { CommandOptions } from '../decorators';
import { LightManagerService } from './light-manager.service';
import { RemoteAdapterService } from './remote-adapter.service';

/**
 * This service searches through all the declared providers looking for rooms.
 * When one is found, secondary classes such as state management and lighting controllers are added.
 * Additionally, this service performs injection on specifically annotated properties
 */
@Injectable()
export class RoomExplorerService {
  public rooms: Map<iRoomController, RoomControllerSettingsDTO>;

  constructor(
    @InjectLogger()
    private readonly logger: AutoLogService,
    private readonly remoteAdapter: RemoteAdapterService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mqtt: MqttService,
    private readonly scanner: ModuleScannerService,
  ) {}

  @Trace()
  protected onPreInit(): void {
    // const map = this.scanner.findWithSymbol<CommandOptions, iRoomController>(
    //   ROOM_API_COMMAND,
    // );
    // map.forEach((options, instance) => {
    //   const proto = instance.constructor.prototype;
    //   proto.areaOn ??= () => {
    //     instance.lightManager.areaOn({ count: 2 });
    //   };
    //   proto.areaOff ??= () => {
    //     instance.lightManager.areaOff({ count: 2 });
    //   };
    //   const descriptors = Object.getOwnPropertyDescriptors(proto);
    //   Reflect.defineMetadata('path', '/areaOn', descriptors.areaOn.value);
    //   Reflect.defineMetadata(
    //     'method',
    //     RequestMethod.GET,
    //     descriptors.areaOn.value,
    //   );
    //   this.logger.info({ options });
    // });

    const settings = this.scanner.findWithSymbol<
      RoomControllerSettingsDTO,
      iRoomController
    >(ROOM_CONTROLLER_SETTINGS);
    settings.forEach((settings, instance) => {
      this.attachRoutes(instance);
    });
  }

  private attachRoutes(instance: iRoomController): void {
    const proto = instance.constructor.prototype;
    proto.areaOn ??= () => {
      instance.lightManager.areaOn({ count: 2 });
    };
    proto.areaOff ??= () => {
      instance.lightManager.areaOff({ count: 2 });
    };
    const descriptors = Object.getOwnPropertyDescriptors(proto);
    Reflect.defineMetadata('path', '/areaOn', descriptors.areaOn.value);
    Reflect.defineMetadata(
      'method',
      RequestMethod.GET,
      descriptors.areaOn.value,
    );
  }

  @Trace()
  protected onModuleInit(): void {
    const settings = this.scanner.findWithSymbol<
      RoomControllerSettingsDTO,
      iRoomController
    >(ROOM_CONTROLLER_SETTINGS);
    this.rooms = settings;
    settings.forEach((settings, instance) => {
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
    const mappings = new Map<
      keyof iRoomControllerMethods,
      (parameters: RoomControllerParametersDTO) => void
    >([
      [
        'areaOn',
        (parameters: RoomControllerParametersDTO) =>
          instance.lightManager.areaOn(parameters),
      ],
      [
        'areaOff',
        (parameters: RoomControllerParametersDTO) =>
          instance.lightManager.areaOff(parameters),
      ],
      [
        'dimUp',
        (parameters: RoomControllerParametersDTO) =>
          instance.lightManager.dimUp(parameters),
      ],
      [
        'dimDown',
        (parameters: RoomControllerParametersDTO) =>
          instance.lightManager.dimDown(parameters),
      ],
      [
        'favorite',
        (parameters: RoomControllerParametersDTO) =>
          instance.favorite ? instance.favorite(parameters) : undefined,
      ],
    ]);
    mappings.forEach((callback, event) => {
      this.logger.debug({
        event: ROOM_COMMAND(name, event),
        mqtt: SEND_ROOM_STATE(name, event),
      });
      this.mqtt.subscribe(SEND_ROOM_STATE(name, event), callback);
      this.eventEmitter.on(ROOM_COMMAND(name, event), callback);
    });
  }
}

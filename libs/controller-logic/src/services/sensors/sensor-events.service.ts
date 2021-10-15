import {
  HA_EVENT_STATE_CHANGE,
  HassEventDTO,
} from '@automagical/home-assistant';
import {
  AutoLogService,
  Info,
  InjectConfig,
  IsEmpty,
  OnEvent,
  Trace,
} from '@automagical/utilities';
import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { each } from 'async';

import { KUNAMI_TIMEOUT } from '../../config';
import {
  KunamiSensor,
  KunamiSensorEvent,
  ROOM_SENSOR_TYPE,
  ROOM_UPDATE,
  RoomDTO,
} from '../../contracts';
import { GroupService } from '../groups';
import { RoomService } from '../rooms';

type ActiveMatcher = KunamiSensorEvent & { callback: () => Promise<void> };
type Watcher = KunamiSensor & {
  callback: () => Promise<void>;
  watcherType: 'room' | 'group';
};
@Injectable()
export class SensorEventsService {
  constructor(
    private readonly logger: AutoLogService,
    @InjectConfig(KUNAMI_TIMEOUT) private readonly kunamiTimeout: number,
    private readonly roomService: RoomService,
    private readonly groupService: GroupService,
  ) {}

  private readonly ACTIVE_MATCHERS = new Map<string, ActiveMatcher[]>();
  private readonly TIMERS = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly WATCHED_SENSORS = new Map<string, Watcher[]>();

  @OnEvent(ROOM_UPDATE)
  public async mountRooms(): Promise<void> {
    this.clearSensors('room');
    const rooms = await this.roomService.list();
    rooms.forEach((room) => {
      room.sensors ??= [];
      room.sensors.forEach((sensor: KunamiSensor) => {
        if (sensor.type === ROOM_SENSOR_TYPE.kunami) {
          const list: Watcher[] =
            this.WATCHED_SENSORS.get(sensor.command.sensor) || [];
          list.push({
            ...sensor,
            callback: async () => await this.executeRoomCommand(sensor, room),
            watcherType: 'room',
          });
          this.WATCHED_SENSORS.set(sensor.command.sensor, list);
        }
      });
    });
  }

  @Trace()
  public async trigger(
    room: RoomDTO | string,
    sensorId: string,
  ): Promise<void> {
    room = await this.roomService.get(room);
    const sensor = room.sensors.find(
      ({ id }) => id === sensorId,
    ) as KunamiSensor;
    if (!sensor) {
      throw new NotFoundException();
    }
    await this.executeRoomCommand(sensor, room);
  }

  @Info({ after: '[Sensor Events] initialized' })
  protected async onApplicationBootstrap(): Promise<void> {
    await this.mountRooms();
  }

  @OnEvent(HA_EVENT_STATE_CHANGE)
  protected async onEntityUpdate({ data }: HassEventDTO): Promise<void> {
    if (!this.WATCHED_SENSORS.has(data.entity_id)) {
      return;
    }
    this.initWatchers(data.entity_id);
    // Build up list of ative matchers
    const process: ActiveMatcher[] = [];
    this.ACTIVE_MATCHERS.get(data.entity_id).forEach((event) => {
      if (event.rejected || event.completed) {
        return;
      }
      process.push(event);
    });
    const state = String(data.new_state.state);
    // Append new state to each matcher, test, then run callback
    await each(process, async (item, callback) => {
      const { command } = item.sensor;
      // Append to list of observed states
      item.progress.push(state);
      // Has appending this event invalidated the command?
      const isValid = item.progress.every(
        (item, index) => command.match[index] === item,
      );
      if (!isValid) {
        item.rejected = true;
        return callback();
      }
      // Has appending this event completed the command?
      item.completed = item.progress.length === command.match.length;
      if (!item.completed) {
        return callback();
      }
      // Run callback
      await item.callback();
      callback();
    });
  }

  @Trace()
  private clearSensors(type: 'room' | 'group'): void {
    this.WATCHED_SENSORS.forEach((sensors, key) => {
      const list = sensors.filter((sensor) => sensor.watcherType === type);
      if (IsEmpty(list)) {
        this.WATCHED_SENSORS.delete(key);
        return;
      }
      this.WATCHED_SENSORS.set(key, list);
    });
  }

  @Trace()
  private async executeRoomCommand(
    { command }: KunamiSensor,
    room: RoomDTO,
  ): Promise<void> {
    this.logger.info({ command }, `Execute room command`);
    switch (command.command) {
      case 'turnOn':
        await this.roomService.turnOn(room, command.scope);
        return;
      case 'turnOff':
        await this.roomService.turnOff(room, command.scope);
        return;
      default:
        await this.roomService.activateState(room, command.saveStateId);
        throw new NotImplementedException();
    }
  }

  @Trace()
  private initWatchers(entity_id: string): void {
    // Clear out old timer
    if (this.TIMERS.has(entity_id)) {
      clearTimeout(this.TIMERS.get(entity_id));
    }

    // Set up new timer
    const timer = setTimeout(() => {
      this.TIMERS.delete(entity_id);
      this.ACTIVE_MATCHERS.delete(entity_id);
      this.logger.debug({ entity_id }, `Timeout`);
    }, this.kunamiTimeout);
    this.TIMERS.set(entity_id, timer);

    // Set up active macher if does not exist
    if (!this.ACTIVE_MATCHERS.has(entity_id)) {
      const initialEvents: ActiveMatcher[] = [];
      this.WATCHED_SENSORS.forEach((sensors) => {
        sensors.forEach((sensor) => {
          initialEvents.push({
            callback: sensor.callback,
            progress: [],
            rejected: false,
            sensor,
          });
        });
      });
      this.ACTIVE_MATCHERS.set(entity_id, initialEvents);
    }
  }
}

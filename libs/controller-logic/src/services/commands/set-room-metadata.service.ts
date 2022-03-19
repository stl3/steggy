import { AutoLogService } from '@automagical/boilerplate';
import { SetRoomMetadataCommandDTO } from '@automagical/controller-shared';
import { is } from '@automagical/utilities';
import { Injectable } from '@nestjs/common';
import EventEmitter from 'eventemitter3';
import { v4 } from 'uuid';

import { MetadataUpdate, ROOM_METADATA_UPDATED } from '../../types';
import { RoomService } from '../room.service';

@Injectable()
export class SetRoomMetadataService {
  constructor(
    private readonly logger: AutoLogService,
    private readonly eventEmitter: EventEmitter,
    private readonly roomService: RoomService,
  ) {}

  public async activate(command: SetRoomMetadataCommandDTO): Promise<void> {
    const room = await this.roomService.get(command.room);
    room.metadata ??= [];
    let entry = room.metadata.find(({ name }) => name === command.name);
    if (!entry) {
      this.logger.warn(
        `[${room.friendlyName}] adding metadata {${command.name}}`,
      );
      entry = {
        id: v4(),
        name: command.name,
        type: is.string(command.value) ? 'string' : 'boolean',
        value: command.value,
      };
      room.metadata.push(entry);
    }
    entry.value = command.value;
    await this.roomService.update({ metadata: room.metadata }, room._id);
    this.logger.debug(`${room.friendlyName}#${entry.name} = ${entry.value}`);
    this.eventEmitter.emit(ROOM_METADATA_UPDATED, {
      name: entry.name,
      room: room._id,
      value: entry.value,
    } as MetadataUpdate);
  }
}

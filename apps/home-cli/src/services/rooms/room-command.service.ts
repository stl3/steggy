import {
  CONCURRENT_CHANGES,
  GroupDTO,
  GROUP_TYPES,
  RoomDTO,
  RoomEntityDTO,
  RoomStateDTO,
} from '@automagical/controller-logic';
import { domain, HASS_DOMAINS } from '@automagical/home-assistant';
import {
  DONE,
  MDIIcons,
  PromptEntry,
  PromptService,
  Repl,
} from '@automagical/tty';
import {
  AutoLogService,
  InjectConfig,
  IsEmpty,
  LIB_CONTROLLER_LOGIC,
} from '@automagical/utilities';
import { NotImplementedException } from '@nestjs/common';
import { each, eachLimit } from 'async';
import chalk from 'chalk';
import { encode } from 'ini';
import inquirer from 'inquirer';
import { LightService } from '../domains';
import { EntityService } from '../entity.service';
import { LightGroupCommandService } from '../groups';
import { GroupCommandService } from '../groups/group-command.service';
import { HomeFetchService } from '../home-fetch.service';
import { RoomStateService } from './room-state.service';

const UP = 1;
const DOWN = -1;
const NAME = 0;
@Repl({
  description: [
    `Rooms can contain groups and entitites, and are intended to manage the state of all items inside of it as a whole.`,
    `Rooms can observe entities for state changes, and trigger routines to make changes to the state.`,
  ],
  icon: MDIIcons.television_box,
  name: `🏡 Rooms`,
  category: `Control`,
})
export class RoomCommandService {
  constructor(
    private readonly logger: AutoLogService,
    private readonly promptService: PromptService,
    private readonly fetchService: HomeFetchService,
    private readonly groupCommand: GroupCommandService,
    private readonly entityService: EntityService,
    private readonly lightDomain: LightService,
    private readonly lightService: LightGroupCommandService,
    private readonly roomState: RoomStateService,
  ) {}

  private async circadianOn(room: RoomDTO): Promise<void> {
    const groups = await this.groupCommand.getMap();
    await Promise.all([
      await each(
        room.entities.filter((i) => domain(i.entity_id) === HASS_DOMAINS.light),
        async ({ entity_id }, callback) => {
          await this.lightDomain.circadianLight(entity_id);
          if (callback) {
            callback();
          }
        },
      ),
      await each(
        room.groups.filter(
          (group) => groups.get(group)?.type === GROUP_TYPES.light,
        ),
        async (group, callback) => {
          await this.lightService.circadianOn(group);
          if (callback) {
            callback();
          }
        },
      ),
    ]);
  }

  public async create(): Promise<RoomDTO> {
    const friendlyName = await this.promptService.string(`Friendly Name`);
    const entities = (await this.promptService.confirm(`Add entities?`, true))
      ? await this.buildEntityList()
      : [];
    const groups = (await this.promptService.confirm(`Add groups?`, true))
      ? await this.groupBuilder()
      : [];
    const body: RoomDTO = {
      entities,
      friendlyName,
      groups,
    };

    return await this.fetchService.fetch({
      body,
      method: 'post',
      url: `/room`,
    });
  }

  public async exec(): Promise<void> {
    const rooms = await this.list();
    let room = await this.promptService.menuSelect<RoomDTO | string>(
      [
        ...this.promptService.conditionalEntries(!IsEmpty(rooms), [
          new inquirer.Separator(chalk.white`Existing rooms`),
          ...(rooms
            .map((room) => [room.friendlyName, room])
            .sort((a, b) => (a[NAME] > b[NAME] ? UP : DOWN)) as [
            string,
            RoomDTO,
          ][]),
        ]),
        new inquirer.Separator(chalk.white`Actions`),
        [`➕ Create`, 'create'],
      ],
      `Pick room`,
    );
    if (room === DONE) {
      return;
    }
    if (room === 'create') {
      room = await this.create();
    }
    if (typeof room === 'string') {
      this.logger.error({ room }, `Not implemented condition`);
      return;
    }
    return await this.processRoom(room);
  }

  public async list(): Promise<RoomDTO[]> {
    return await this.fetchService.fetch({
      url: `/room`,
    });
  }

  public async pickOne(current?: RoomDTO | string): Promise<RoomDTO> {
    const rooms = await this.list();
    current =
      typeof current === 'string'
        ? rooms.find(({ _id }) => _id === current)
        : current;
    const room = await this.promptService.pickOne<RoomDTO | string>(
      `Pick a room`,
      [
        [`➕ Create new`, `create`],
        ...this.promptService.conditionalEntries(
          !IsEmpty(rooms),
          rooms.map((room) => [room.friendlyName, room]),
        ),
      ],
      current,
    );
    if (room === `create`) {
      return await this.create();
    }
    if (typeof room === `string`) {
      throw new NotImplementedException();
    }
    return room;
  }

  public async processRoom(
    room: RoomDTO,
    defaultAction?: string,
  ): Promise<void> {
    this.promptService.header(room.friendlyName);
    room.save_states ??= [];
    const action = await this.promptService.menuSelect(
      [
        new inquirer.Separator(chalk.white`Commands`),
        ['Turn On', 'turnOn'],
        ['Turn Off', 'turnOff'],
        ...this.promptService.conditionalEntries(
          IsEmpty(
            room.entities.filter(
              (i) => domain(i.entity_id) === HASS_DOMAINS.light,
            ),
          ),
          [
            ['Circadian On', 'circadianOn'],
            ['Dim Up', 'dimUp'],
            ['Dim Down', 'dimDown'],
          ],
        ),
        new inquirer.Separator(chalk.white`States`),
        ['Crreate State', 'createState'],
        ...(room.save_states.map((state) => [
          state.friendlyName,
          state,
        ]) as PromptEntry<RoomStateDTO>[]),
        new inquirer.Separator(chalk.white`Maintenance`),
        ['Delete', 'delete'],
        ['Describe', 'describe'],
        ['Entities', 'entities'],
        ['Groups', 'groups'],
        ['Rename', 'rename'],
      ],
      `Action`,
      defaultAction,
    );
    switch (action) {
      case 'createState':
        // room = await this.roomState.addState(room);
        return await this.processRoom(room, action);
      case 'dimDown':
        await this.dimDown(room);
        return await this.processRoom(room, action);
      case 'dimUp':
        await this.dimUp(room);
        return await this.processRoom(room, action);
      case 'circadianOn':
        await this.circadianOn(room);
        return await this.processRoom(room, action);
      case 'rename':
        room.friendlyName = await this.promptService.string(
          `New name`,
          room.friendlyName,
        );
        room = await this.update(room);
        return await this.processRoom(room, action);
      case 'turnOn':
        await this.fetchService.fetch({
          method: 'put',
          url: `/room/${room._id}/turnOn`,
        });
        return await this.processRoom(room, action);
      case 'turnOff':
        await this.fetchService.fetch({
          method: 'put',
          url: `/room/${room._id}/turnOff`,
        });
        return await this.processRoom(room, action);
      case 'delete':
        await this.fetchService.fetch({
          method: 'delete',
          url: `/room/${room._id}`,
        });
        return;
      case DONE:
        return;
      case 'describe':
        console.log(encode(room));
        return await this.processRoom(room, action);
      case 'entities':
        room = await this.roomEntities(room);
        return await this.processRoom(room, action);
      case 'groups':
        await this.roomGroups(room);
        return await this.processRoom(room, action);
    }
  }

  public async update(body: RoomDTO): Promise<RoomDTO> {
    return await this.fetchService.fetch({
      body,
      method: 'put',
      url: `/room/${body._id}`,
    });
  }

  private async buildEntityList(omit: string[] = []): Promise<RoomEntityDTO[]> {
    const ids = await this.entityService.buildList(
      [
        HASS_DOMAINS.light,
        HASS_DOMAINS.switch,
        HASS_DOMAINS.media_player,
        HASS_DOMAINS.fan,
      ],
      omit,
    );
    return ids.map((entity_id) => ({
      entity_id,
      tags: [],
    }));
  }

  private async dimDown(room: RoomDTO): Promise<void> {
    const groups = await this.groupCommand.getMap();
    await Promise.all([
      await each(
        room.entities.filter((i) => domain(i.entity_id) === HASS_DOMAINS.light),
        async ({ entity_id }) => await this.lightDomain.dimDown(entity_id),
      ),
      await each(
        room.groups.filter(
          (group) => groups.get(group)?.type === GROUP_TYPES.light,
        ),
        async (group) => await this.lightService.dimDown(group),
      ),
    ]);
  }

  private async dimUp(room: RoomDTO): Promise<void> {
    const groups = await this.groupCommand.getMap();
    await Promise.all([
      await each(
        room.entities.filter((i) => domain(i.entity_id) === HASS_DOMAINS.light),
        async ({ entity_id }) => await this.lightDomain.dimUp(entity_id),
      ),
      await each(
        room.groups.filter(
          (group) => groups.get(group)?.type === GROUP_TYPES.light,
        ),
        async (group) => await this.lightService.dimUp(group),
      ),
    ]);
  }

  private async groupBuilder(current: string[] = []): Promise<string[]> {
    const action = await this.promptService.pickOne(`Group actions`, [
      ['Use existing', 'existing'],
      ['Create new', 'create'],
      ['Done', 'done'],
    ]);
    switch (action) {
      //
      case 'create':
        // pointless destructuring ftw
        const { _id } = await this.groupCommand.create();
        current.push(_id);
        return await this.groupBuilder(current);
      // Eject!
      case 'done':
        return current;
      //
      case 'existing':
        const groups = await this.groupCommand.list();
        const selection = await this.promptService.pickMany(
          `Groups to attach`,
          groups
            .filter(({ _id }) => !current.includes(_id))
            .map((group) => [group.friendlyName, group]),
        );
        if (IsEmpty(selection)) {
          this.logger.warn(`No groups selected`);
        } else {
          current.push(...selection.map((item) => item._id));
        }
        return current;
    }
    this.logger.error({ action }, `Not implemented`);
    return current;
  }

  private async roomEntities(room: RoomDTO): Promise<RoomDTO> {
    room.entities ??= [];
    const actions: PromptEntry<string>[] = [['Add', 'add']];
    if (IsEmpty(room.entities)) {
      this.logger.warn(`No current entities in room`);
    } else {
      actions.push(
        ['Remove', 'remove'],
        new inquirer.Separator(),
        ...(room.entities.map(({ entity_id }) => [
          entity_id,
          entity_id,
        ]) as PromptEntry[]),
      );
    }
    const action = await this.promptService.menuSelect([
      ['Add', 'add'],
      ...this.promptService.conditionalEntries(!IsEmpty(room.entities), [
        ['Remove', 'remove'],
        new inquirer.Separator(chalk.white`Manipulate`),
        ...(room.entities.map(({ entity_id }) => [
          entity_id,
          entity_id,
        ]) as PromptEntry[]),
      ]),
    ]);
    if (action === DONE) {
      return room;
    }
    if (action === 'add') {
      const entityAppend = await this.buildEntityList(
        room.entities.map((item) => item.entity_id),
      );
      if (IsEmpty(entityAppend)) {
        this.logger.debug(`Nothing to add`);
        return;
      }
      room.entities.push(...entityAppend);
      room = await this.update(room);
      return await this.roomEntities(room);
    }
    if (action === 'remove') {
      const entities = await this.promptService.pickMany(
        `Keep selected`,
        room.entities
          .map(({ entity_id }) => [entity_id, entity_id])
          .sort(([a], [b]) => (a > b ? 1 : -1)) as PromptEntry[],
        { default: room.entities.map(({ entity_id }) => entity_id) },
      );
      room = await this.update({
        ...room,
        entities: room.entities.filter((item) =>
          entities.includes(item.entity_id),
        ),
      });
      return await this.roomEntities(room);
    }
    await this.entityService.process(action);
    return await this.roomEntities(room);
  }

  private async roomGroups(room: RoomDTO): Promise<void> {
    room.groups ??= [];
    if (IsEmpty(room.groups)) {
      this.logger.warn(`No current groups in room`);
    }
    const allGroups = await this.groupCommand.list();
    const action = await this.promptService.menuSelect<GroupDTO>([
      ['Add', 'add'],
      ...this.promptService.conditionalEntries(!IsEmpty(room.groups), [
        ['Remove', 'remove'],
        new inquirer.Separator(),
        ...(allGroups
          .filter(({ _id }) => room.groups.includes(_id))
          .map((group) => [
            group.friendlyName,
            group,
          ]) as PromptEntry<GroupDTO>[]),
      ]),
    ]);
    switch (action) {
      case DONE:
        return;
      case 'add':
        room.groups ??= [];
        const group = await this.groupCommand.pickOne(room.groups);
        room.groups.push(group._id);
        room = await this.update(room);
        return await this.roomGroups(room);
      case 'remove':
        const groups = await this.groupCommand.pickMany(
          room.groups,
          room.groups,
        );
        room.groups = groups.map(({ _id }) => _id);
        room = await this.update(room);
        return await this.roomGroups(room);
    }
    if (typeof action === 'string') {
      this.logger.error({ action }, `Not implemented`);
      return;
    }
    await this.groupCommand.process(action, allGroups);
  }
}

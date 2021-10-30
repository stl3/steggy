import type {
  GENERIC_COMMANDS,
  ROOM_ENTITY_EXTRAS,
} from '@automagical/controller-logic';
import {
  GroupDTO,
  GroupSaveStateDTO,
  GroupService,
  HomeControllerResponseLocals,
} from '@automagical/controller-logic';
import { BaseSchemaDTO } from '@automagical/persistence';
import {
  AuthStack,
  GENERIC_SUCCESS_RESPONSE,
  Locals,
} from '@automagical/server';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

@Controller('/group')
@AuthStack()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Put(`/:group/command/:command`)
  public async activateCommand(
    @Param('group') group: string,
    @Param('command') command: GENERIC_COMMANDS,
    @Body() extra: Record<string, unknown>,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.groupService.activateCommand({
      command,
      extra,
      group,
    });
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Post(`/:group/state/:state`)
  public async activateState(
    @Param('group') group: string,
    @Param('state') state: string,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.groupService.activateState({ group, state });
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Post(`/:group/state`)
  public async addState(
    @Param('group') group: string,
    @Body() state: GroupSaveStateDTO,
  ): Promise<GroupDTO> {
    return await this.groupService.addState(group, state);
  }

  @Post('/:group/state/capture')
  public async captureCurrent(
    @Param('group') group: string,
    @Body() { name }: { name: string },
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.groupService.captureState(group, name);
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Post('/')
  public async createGroup(@Body() group: GroupDTO): Promise<GroupDTO> {
    return await this.groupService.create(BaseSchemaDTO.cleanup(group));
  }

  @Delete(`/:group`)
  public async deleteGroup(
    @Param('group') group: string,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.groupService.delete(group);
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Delete(`/:group/state/:state`)
  public async deleteSaveSate(
    @Param('group') group: string,
    @Param('state') state: string,
  ): Promise<GroupDTO> {
    return await this.groupService.deleteState(group, state);
  }

  @Get('/:group')
  public async describe(@Param('group') group: string): Promise<GroupDTO> {
    return await this.groupService.get(group);
  }

  @Put(`/:group/expand`)
  public async expandState(
    @Param('group') group: string,
    @Body() state: ROOM_ENTITY_EXTRAS,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.groupService.expandState(group, state);
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Get(`/`)
  public async listGroups(
    @Locals() { control }: HomeControllerResponseLocals,
  ): Promise<GroupDTO[]> {
    return await this.groupService.list(control);
  }

  @Delete(`/:group/state/truncate`)
  public async truncateStates(
    @Param('group') group: string,
  ): Promise<typeof GENERIC_SUCCESS_RESPONSE> {
    await this.groupService.truncate(group);
    return GENERIC_SUCCESS_RESPONSE;
  }

  @Put('/:group')
  public async update(
    @Param('group') id: string,
    @Body() body: Partial<GroupDTO>,
  ): Promise<GroupDTO> {
    return await this.groupService.update(id, BaseSchemaDTO.cleanup(body));
  }

  @Put(`/:group/state/:state`)
  public async updateState(
    @Param('group') group: string,
    @Param('state') state: string,
    @Body() body: GroupSaveStateDTO,
  ): Promise<GroupDTO> {
    return await this.groupService.updateState(group, state, body);
  }
}

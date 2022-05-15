import {
  GroupService,
  iRoutineCommand,
  RoutineCommand,
} from '@steggy/controller-sdk';
import {
  RoutineCommandDTO,
  RoutineCommandGroupActionDTO,
} from '@steggy/controller-shared';

@RoutineCommand({
  description: 'Perform a special group action',
  name: 'Group Action',
  type: 'group_action',
})
export class GroupActionCommandService
  implements iRoutineCommand<RoutineCommandGroupActionDTO>
{
  constructor(private readonly groupService: GroupService) {}

  public async activate({
    command,
    waitForChange,
  }: {
    command: RoutineCommandDTO<RoutineCommandGroupActionDTO>;
    waitForChange: boolean;
  }): Promise<void> {
    await this.groupService.activateCommand(command.command, waitForChange);
  }
}

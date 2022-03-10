import { RoutineRestoreCommandDTO } from '@automagical/controller-shared';
import { PromptService } from '@automagical/tty';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RestoreService {
  constructor(private readonly promptService: PromptService) {}

  public async build(
    current: Partial<RoutineRestoreCommandDTO>,
  ): Promise<RoutineRestoreCommandDTO> {
    current.key = await this.promptService.string('Cache key (blank = auto)');
    return current;
  }
}
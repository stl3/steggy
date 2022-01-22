import { Injectable } from '@nestjs/common';
import { AutoLogService } from '@text-based/boilerplate';
import { RoutineCommandStopProcessing } from '@text-based/controller-shared';

@Injectable()
export class StopProcessingCommandService {
  constructor(private readonly logger: AutoLogService) {}

  public async activate(
    command: RoutineCommandStopProcessing,
  ): Promise<boolean> {
    return await false;
    command;
  }
}
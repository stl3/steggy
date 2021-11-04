import {
  KunamiCodeActivateDTO,
  ROUTINE_ACTIVATE_TYPE,
  RoutineActivateDTO,
  RoutineDTO,
  ScheduleActivateDTO,
  StateChangeActivateDTO,
} from '@automagical/controller-logic';
import { DONE, PromptEntry, PromptService } from '@automagical/tty';
import { IsEmpty, TitleCase } from '@automagical/utilities';
import {
  forwardRef,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import inquirer from 'inquirer';
import { v4 as uuid } from 'uuid';

import { ICONS } from '../../typings';
import { KunamiBuilderService } from './kunami-builder.service';
import { RoutineService } from './routine.service';
import { ScheduleBuilderService } from './schedule-builder.service';
import { StateChangeBuilderService } from './state-change-builder.service';

@Injectable()
export class RoutineActivateEventsService {
  constructor(
    private readonly kunamiActivate: KunamiBuilderService,
    private readonly stateActivate: StateChangeBuilderService,
    private readonly schduleActivate: ScheduleBuilderService,
    private readonly promptService: PromptService,
    @Inject(forwardRef(() => RoutineService))
    private readonly routineCommand: RoutineService,
  ) {}

  public async build(
    current: Partial<RoutineActivateDTO> = {},
  ): Promise<RoutineActivateDTO> {
    const friendlyName = await this.promptService.friendlyName(
      current.friendlyName,
    );
    const type = await this.promptService.pickOne<ROUTINE_ACTIVATE_TYPE>(
      `Activation type`,
      Object.values(ROUTINE_ACTIVATE_TYPE).map((value) => [
        TitleCase(value),
        value,
      ]),
      current.type,
    );
    switch (type) {
      case ROUTINE_ACTIVATE_TYPE.kunami:
        return {
          activate: await this.kunamiActivate.build(
            current.activate as KunamiCodeActivateDTO,
          ),
          friendlyName,
          type,
        };
      case ROUTINE_ACTIVATE_TYPE.state_change:
        return {
          activate: await this.stateActivate.build(
            current.activate as StateChangeActivateDTO,
          ),
          friendlyName,
          type,
        };
      case ROUTINE_ACTIVATE_TYPE.schedule:
        return {
          activate: await this.schduleActivate.build(
            current.activate as ScheduleActivateDTO,
          ),
          friendlyName,
          type,
        };
    }
  }

  public async process(
    routine: RoutineDTO,
    activate: RoutineActivateDTO,
  ): Promise<RoutineDTO> {
    const action = await this.promptService.menuSelect([
      [`${ICONS.DELETE}Remove`, 'remove'],
      [`${ICONS.EDIT}Edit`, 'edit'],
    ]);
    switch (action) {
      case DONE:
        return routine;
      case 'edit':
        const updated = await this.build(activate);
        routine.activate = routine.activate.map((i) =>
          i.id === activate.id ? { ...updated, id: i.id } : i,
        );
        routine = await this.routineCommand.update(routine);
        return await this.process(
          routine,
          routine.activate.find(({ id }) => id === activate.id),
        );
      case 'remove':
        routine.activate = routine.activate.filter(
          ({ id }) => id !== activate.id,
        );
        routine = await this.routineCommand.update(routine);
        return await this.process(
          routine,
          routine.activate.find(({ id }) => id === activate.id),
        );
    }
  }

  public async processRoutine(routine: RoutineDTO): Promise<RoutineDTO> {
    routine.activate ??= [];
    const action = await this.promptService.menuSelect([
      [`${ICONS.CREATE}Add`, 'add'],
      ...this.promptService.conditionalEntries(!IsEmpty(routine.activate), [
        new inquirer.Separator(),
        ...(routine.activate.map((activate) => [
          activate.friendlyName,
          activate,
        ]) as PromptEntry<RoutineActivateDTO>[]),
      ]),
    ]);
    switch (action) {
      case DONE:
        return routine;
      case 'add':
        const activate = await this.build();
        activate.id = uuid();
        routine.activate.push(activate);
        routine = await this.routineCommand.update(routine);
        return await this.processRoutine(routine);
    }
    if (typeof action === 'string') {
      throw new NotImplementedException();
    }
    routine = await this.process(routine, action);
    return await this.processRoutine(routine);
  }
}
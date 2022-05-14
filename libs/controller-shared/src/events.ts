import { CronJob } from 'cron';

import {
  AttributeChangeActivateDTO,
  ScheduleActivateDTO,
  SequenceActivateDTO,
  SolarActivateDTO,
} from './routines';
import { RoutineDTO } from './schemas';

export const GROUP_UPDATE = 'GROUP_UPDATE';
export const ROOM_UPDATE = 'ROOM_UPDATE';
export const PERSON_UPDATE = 'PERSON_UPDATE';
export const ROUTINE_UPDATE = 'ROUTINE_UPDATE';
export const LOCATION_UPDATED = 'LOCATION_UPDATED';

import { ServeStaticModule } from '@nestjs/serve-static';
import { ApplicationModule, RegisterCache } from '@steggy/boilerplate';
import {
  GroupDTO,
  MetadataDTO,
  RoomDTO,
  RoutineDTO,
} from '@steggy/controller-shared';
import { HomeAssistantModule } from '@steggy/home-assistant';
import { QuickConnectModule } from '@steggy/persistence';
import { ServerModule } from '@steggy/server';
import { existsSync } from 'fs';
import { join } from 'path';

import {
  CIRCADIAN_MAX_TEMP,
  CIRCADIAN_MIN_TEMP,
  MIN_BRIGHTNESS,
  NODE_RED_URL,
  NOTIFY_CONNECTION_RESET,
  NOTIFY_UNAVAILABLE_DURATION,
  SAFE_MODE,
  SEQUENCE_TIMEOUT,
  UNAVAILABLE_MONITOR_HOUR,
} from '../config';
import {
  AdminController,
  AnimationController,
  DebugController,
  DeviceController,
  EntityController,
  GroupController,
  MetadataController,
  RoomController,
  RoutineController,
} from '../controllers';
import {
  ApplicationService,
  AttributeChangeActivateService,
  AvailabilityMonitorService,
  CaptureCommandService,
  ChronoService,
  CircadianService,
  DebuggerService,
  EntityCommandRouterService,
  EntityRenameService,
  EntityService,
  FanGroupService,
  FlashAnimationService,
  GroupPersistenceService,
  GroupService,
  LightFlashCommandService,
  LightGroupService,
  LightManagerService,
  LockGroupService,
  MetadataChangeService,
  MetadataPersistenceService,
  MetadataService,
  NodeRedCommand,
  RoomPersistenceService,
  RoomService,
  RoutineEnabledService,
  RoutinePersistenceService,
  RoutineService,
  RoutineTriggerService,
  ScheduleActivateService,
  SendNotificationService,
  SequenceActivateService,
  SetRoomMetadataService,
  SleepCommandService,
  SolarActivateService,
  SolarCalcService,
  StateChangeActivateService,
  StopProcessingCommandService,
  SwitchGroupService,
  UpdateLoggerService,
  VMService,
  WebhookService,
} from '../services';

const rootPath = join(__dirname, 'ui');

const providers = [
  ...[SendNotificationService, WebhookService],
  ...[
    FanGroupService,
    GroupService,
    LightGroupService,
    LockGroupService,
    SwitchGroupService,
  ],
  ...[
    AttributeChangeActivateService,
    CaptureCommandService,
    MetadataChangeService,
    RoutineService,
    ScheduleActivateService,
    SequenceActivateService,
    SolarActivateService,
    StateChangeActivateService,
  ],
  ...[
    CircadianService,
    FlashAnimationService,
    LightFlashCommandService,
    LightManagerService,
    NodeRedCommand,
    RoutineEnabledService,
    RoutineTriggerService,
    SetRoomMetadataService,
    SleepCommandService,
    SolarCalcService,
    StopProcessingCommandService,
  ],
  ApplicationService,
  AvailabilityMonitorService,
  ChronoService,
  DebuggerService,
  EntityCommandRouterService,
  EntityRenameService,
  EntityService,
  GroupPersistenceService,
  MetadataPersistenceService,
  MetadataService,
  RoomPersistenceService,
  RoomService,
  RoutinePersistenceService,
  UpdateLoggerService,
  VMService,
];

@ApplicationModule({
  application: Symbol('home-controller'),
  configuration: {
    [CIRCADIAN_MAX_TEMP]: {
      default: 5500,
      description:
        'Maximum color temperature for circadian lighting. Used at solar noon',
      type: 'number',
    },
    [CIRCADIAN_MIN_TEMP]: {
      default: 2000,
      description:
        "Minimum color temperature for circadian lighting. Used while it's dark out",
      type: 'number',
    },
    [MIN_BRIGHTNESS]: {
      default: 5,
      description:
        'Enforce a number higher than 1 for min brightness in dimmers. Some lights do weird stuff at low numbers',
      type: 'number',
    },
    [NODE_RED_URL]: {
      description: 'API target for outgoing node red hooks.',
      type: 'string',
    },
    [NOTIFY_CONNECTION_RESET]: {
      default: true,
      description:
        'Send a notification when home assistant connection is reset',
      type: 'boolean',
    },
    [NOTIFY_UNAVAILABLE_DURATION]: {
      // 4 hours = 1000 * 60 * 60 * 4
      default: 14_400_000,
      description: 'Raise error if entity is unavailable for this long',
      type: 'number',
    },
    [SAFE_MODE]: {
      default: false,
      description: 'Disable all activation events for routines',
      type: 'boolean',
    },
    [SEQUENCE_TIMEOUT]: {
      default: 1500,
      description:
        'When tracking state changes for a kunami event, another change must happen inside this time window',
      type: 'number',
    },
    [UNAVAILABLE_MONITOR_HOUR]: {
      default: 11,
      description: 'When to send notifications about unavailable entities',
      type: 'number',
    },
  },
  controllers: [
    AdminController,
    AnimationController,
    DebugController,
    DeviceController,
    EntityController,
    GroupController,
    RoomController,
    RoutineController,
    MetadataController,
  ],
  imports: [
    HomeAssistantModule,
    RegisterCache(),
    ...QuickConnectModule.forRoot([GroupDTO, RoomDTO, RoutineDTO, MetadataDTO]),
    ...(existsSync(rootPath) ? [ServeStaticModule.forRoot({ rootPath })] : []),
    ServerModule,
  ],
  providers,
})
export class HomeControllerModule {}

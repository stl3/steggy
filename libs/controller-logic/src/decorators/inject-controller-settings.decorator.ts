import { Inject, Provider } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import { v4 } from 'uuid';

import { iRoomController, ROOM_CONTROLLER_SETTINGS } from '..';

export const InjectedSettings = new Set<Provider>();
export function InjectControllerSettings(
  controller: ClassConstructor<iRoomController>,
): ParameterDecorator {
  return function (target, key, index) {
    const id = v4().toString();
    InjectedSettings.add({
      provide: id,
      useFactory() {
        return controller[ROOM_CONTROLLER_SETTINGS];
      },
    });
    return Inject(id)(target, key, index);
  };
}
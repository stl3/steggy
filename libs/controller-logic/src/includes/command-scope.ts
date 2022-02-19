import {
  RoomCommandDTO,
  RoomCommandScope,
} from '@automagical/controller-shared';

export function COMMAND_SCOPE(
  parameters: RoomCommandDTO,
): Set<RoomCommandScope> {
  parameters ??= {};
  parameters.scope ??= [];
  parameters.scope = Array.isArray(parameters.scope)
    ? parameters.scope
    : [parameters.scope];
  return new Set(parameters.scope);
}

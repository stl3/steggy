export const LIGHTING_CONTROLLER = Symbol('LIGHTING_CONTROLLER');
export const HASS_ENTITY_ID = Symbol('HASS_ENTITY_ID');
export const STATE_MANAGER = Symbol('STATE_MANAGER');

export enum ControllerStates {
  on = 'on',
  off = 'off',
  up = 'up',
  down = 'down',
  favorite = 'favorite',
  none = 'none',
}

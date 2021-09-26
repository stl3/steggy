import { LIGHTING_MODE } from './room-state.dto';

export enum LightingCacheMode {
  /**
   * Circadian lighting controller owns the logic for this device currently
   */
  circadian = 'circadian',
  /**
   * The device is acknowledged as on, but nothing has control currently
   *
   * Perhaps manually turned on via home assistant or some other process
   */
  on = 'on',
}

export class LightingCacheDTO {
  public brightness?: number;
  public kelvin?: number;
  public hs?: [number, number] | number[];
  public mode: LIGHTING_MODE;
}

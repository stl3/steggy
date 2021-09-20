/**
 * One scope does NOT imply the others
 */
export enum RoomCommandScope {
  /**
   * Run against local devices
   */
  LOCAL,
  /**
   * Affect secondary devices
   */
  ACCESSORIES,
  /**
   * Attempt to broadcast to other rooms
   */
  BROADCAST,
  /**
   * An overridee method requested the standard call not process
   */
  ABORT,
}

/**
 * Affect the way a command is processeded by the system
 */
export class RoomCommandDTO {
  scope?: RoomCommandScope | RoomCommandScope[];
  increment?: number;
}

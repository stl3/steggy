import { ROOM_NAMES } from './room-names';

/**
 * Generic 'stuff is happening' event
 */
export const GLOBAL_TRANSITION = 'GLOBAL_TRANSITION';
export const ROOM_FAVORITE = (room: ROOM_NAMES): string => `favorite/${room}`;
export const ENTITY_METADATA_UPDATED = (type: string) =>
  `ENTITY_METADATA_UPDATED_${type}`;
export const ROOM_METADATA_UPDATED = 'ROOM_METADATA_UPDATED';
export const PERSON_METADATA_UPDATED = 'PERSON_METADATA_UPDATED';

export interface MetadataUpdate {
  name: string;
  room: string;
  value: unknown;
}

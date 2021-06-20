export const BASE_URL = 'libs.home-assistant.BASE_URL';
export const HOST = 'libs.home-assistant.HOST';
export const TOKEN = 'libs.home-assistant.TOKEN';
/**
 * home-assistant/SocketService#updateAllEntities
 */
export const ALL_ENTITIES_UPDATED = Symbol('ALL_ENTITIES_UPDATED');
/**
 * home-assistant/SocketService#initConnection
 */
export const CONNECTION_RESET = Symbol('CONNECTION_RESET');
/**
 * home-assistant/SocketService#onMessage
 */
export const HA_RAW_EVENT = 'raw-event';
export const HA_EVENT_STATE_CHANGE = Symbol('HA_EVENT_STATE_CHANGE');
export const HA_SOCKET_READY = Symbol('HA_SOCKET_READY');
export const GLOBAL_ON = Symbol('GLOBAL_ON');
export const GLOBAL_OFF = Symbol('GLOBAL_OFF');

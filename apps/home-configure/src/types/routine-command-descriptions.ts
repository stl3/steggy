import { DOWN, UP } from '@steggy/utilities';

type listItem = Record<'type' | 'name' | 'description', string>;
export const ROUTINE_COMMAND_LIST = [
  {
    description: 'Change an entity state',
    name: 'Entity State',
    type: 'entity_state',
  },
  {
    description: 'Activate a node in Node Red',
    name: 'Node Red',
    type: 'node_red',
  },
  {
    description: 'Activate a previously saved group state',
    name: 'Group State',
    type: 'group_state',
  },
  {
    description: 'Perform a special group action',
    name: 'Group Action',
    type: 'group_action',
  },
  {
    description: 'Activate a previously saved room state',
    name: 'Room State',
    type: 'room_state',
  },
  {
    description: 'Activate a previously saved person state',
    name: 'Person State',
    type: 'person_state',
  },
  {
    description: 'Send notification using Home Assistant',
    name: 'Send Notification',
    type: 'send_notification',
  },
  {
    description:
      'Conditionally stop the command sequence. Only usable with synchronous command processing',
    name: 'Stop Processing',
    type: 'stop_processing',
  },
  {
    description: 'Trigger another routine',
    name: 'Trigger Routine',
    type: 'trigger_routine',
  },
  {
    description: 'Emit a http request from the controller',
    name: 'Webhook',
    type: 'webhook',
  },
  {
    description:
      'Pause processing for a period of time. Only usable with synchronous command processing',
    name: 'Sleep',
    type: 'sleep',
  },
  {
    description: 'Update metadata for a person/room',
    name: 'Metadata Set',
    type: 'set_metadata',
  },
].sort((a, b) => (a.name > b.name ? UP : DOWN)) as listItem[];

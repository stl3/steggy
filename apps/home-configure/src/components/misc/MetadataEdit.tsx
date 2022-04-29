import { RoomDTO, RoomMetadataDTO } from '@steggy/controller-shared';
import { is } from '@steggy/utilities';
import {
  Checkbox,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Space,
} from 'antd';
import moment from 'moment';
import React from 'react';

// eslint-disable-next-line radar/cognitive-complexity
export function MetadataEdit(props: {
  metadata: RoomMetadataDTO;
  onComplete: () => void;
  onUpdate: (metadata: Partial<RoomMetadataDTO>) => void;
  room: RoomDTO;
}) {
  function renderValue() {
    const { type, value, options } = props.metadata;
    if (type === 'boolean') {
      return (
        <Checkbox
          checked={Boolean(value)}
          onChange={({ target }) => props.onUpdate({ value: target.checked })}
        />
      );
    }
    if (type === 'number') {
      return (
        <Input
          type="number"
          defaultValue={Number(value)}
          onBlur={({ target }) => props.onUpdate({ value: target.value })}
        />
      );
    }
    if (type === 'enum') {
      return (
        <Select value={value} onChange={value => props.onUpdate({ value })}>
          {(options ?? []).map(item => (
            <Select.Option value={item} key={item}>
              {item}
            </Select.Option>
          ))}
        </Select>
      );
    }
    if (type === 'date') {
      return (
        <DatePicker
          showTime
          onChange={value => props.onUpdate({ value: value.toISOString() })}
          value={moment(
            is.date(value) || is.string(value) ? value : new Date(),
          )}
        />
      );
    }
    return (
      <Input
        defaultValue={String(value)}
        onBlur={({ target }) => props.onUpdate({ value: target.value })}
      />
    );
  }

  return (
    <Drawer
      visible={!is.undefined(props.metadata)}
      title="Edit Metadata"
      onClose={() => props.onComplete()}
    >
      {is.undefined(props.metadata) ? undefined : (
        <Space direction="vertical">
          <Form.Item label="Property name">
            <Input
              defaultValue={props.metadata.name}
              onBlur={({ target }) => props.onUpdate({ name: target.value })}
            />
          </Form.Item>
          <Form.Item label="Property type">
            <Select
              value={props.metadata.type}
              onChange={type => props.onUpdate({ type })}
            >
              <Select.Option value="string">string</Select.Option>
              <Select.Option value="enum">enum</Select.Option>
              <Select.Option value="boolean">boolean</Select.Option>
              <Select.Option value="number">number</Select.Option>
              <Select.Option value="date">date</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Current value">{renderValue()}</Form.Item>
          {props.metadata.type !== 'enum' ? undefined : (
            <>
              <Divider orientation="left">Enum options (1 per line)</Divider>
              <Input.TextArea
                defaultValue={(props.metadata.options ?? []).join(`\n`)}
                onBlur={({ target }) =>
                  props.onUpdate({
                    options: target.value
                      .trim()
                      .split(`\n`)
                      .map(i => i.trim()),
                  })
                }
              />
            </>
          )}
        </Space>
      )}
    </Drawer>
  );
}

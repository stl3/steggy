import { HassStateDTO } from '@steggy/home-assistant-shared';
import { Space, Table, Typography } from 'antd';
import React from 'react';

export function EntityAttributePopover({ state }: { state: HassStateDTO }) {
  const attributes = state.attributes;
  const data = Object.keys(attributes).map(key => ({
    key,
    value: attributes[key],
  }));
  return (
    <Space direction="vertical">
      <Typography.Text>State: {state.state}</Typography.Text>
      <Table dataSource={data}>
        <Table.Column key="key" title="key" dataIndex="key" />
        <Table.Column key="value" title="value" dataIndex="value" />
      </Table>
    </Space>
  );
}

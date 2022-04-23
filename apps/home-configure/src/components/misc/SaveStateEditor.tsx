import { QuestionCircleOutlined } from '@ant-design/icons';
import { PersonDTO, RoomDTO, RoomStateDTO } from '@steggy/controller-shared';
import { DOWN, UP } from '@steggy/utilities';
import {
  Button,
  Card,
  Form,
  FormInstance,
  Input,
  List,
  Popconfirm,
  Space,
} from 'antd';
import React from 'react';

import { FD_ICONS, sendRequest } from '../../types';
import { RoomStateEdit } from '../rooms';
import { RelatedRoutines } from '../routines';

export class SaveStateEditor extends React.Component<{
  onUpdate: (room: PersonDTO) => void;
  person?: PersonDTO;
  room?: RoomDTO;
}> {
  override state = { modalVisible: false };
  private form: FormInstance;

  private get room() {
    return this.props.room ?? this.props.person;
  }

  private get routeBase() {
    if (this.props.person) {
      return `person`;
    }
    return `room`;
  }

  override render() {
    return (
      <Space style={{ width: '100%' }} direction="vertical" size="large">
        <Card
          type="inner"
          title="Save States"
          extra={
            <Popconfirm
              icon={<QuestionCircleOutlined style={{ visibility: 'hidden' }} />}
              onConfirm={this.validate.bind(this)}
              title={
                <Form
                  onFinish={this.validate.bind(this)}
                  ref={form => (this.form = form)}
                >
                  <Form.Item
                    label="Friendly Name"
                    name="friendlyName"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Form>
              }
            >
              <Button size="small" icon={FD_ICONS.get('plus_box')}>
                Create new
              </Button>
            </Popconfirm>
          }
        >
          <List
            pagination={{ size: 'small' }}
            dataSource={this.room.save_states.sort((a, b) =>
              a.friendlyName > b.friendlyName ? UP : DOWN,
            )}
            renderItem={record => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <RoomStateEdit
                      key={record.id}
                      onUpdate={group => this.props.onUpdate(group)}
                      room={this.props.room}
                      person={this.props.person}
                      state={record}
                    />
                  }
                />
                <Button
                  onClick={() => this.activateState(record)}
                  type="primary"
                  size="small"
                  icon={FD_ICONS.get('execute')}
                >
                  Activate
                </Button>
                <Popconfirm
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  title={`Are you sure you want to delete ${record.friendlyName}`}
                  onConfirm={() => this.removeState(record)}
                >
                  <Button danger size="small" type="text">
                    X
                  </Button>
                </Popconfirm>
              </List.Item>
            )}
          />
        </Card>
        <Card type="inner" title="Used in routines">
          <RelatedRoutines roomState={this.room} />
        </Card>
      </Space>
    );
  }

  private async activateState(record: RoomStateDTO): Promise<void> {
    await sendRequest({
      method: 'post',
      url: `/${this.routeBase}/${this.room._id}/state/${record.id}`,
    });
  }

  private async removeState(record: RoomStateDTO): Promise<void> {
    const room = await sendRequest<RoomDTO>({
      method: 'delete',
      url: `/${this.routeBase}/${this.room._id}/state/${record.id}`,
    });
    this.props.onUpdate(room);
  }

  private async validate(): Promise<void> {
    try {
      const values = await this.form.validateFields();
      const room = await sendRequest<RoomDTO>({
        body: values,
        method: 'post',
        url: `/${this.routeBase}/${this.room._id}/state`,
      });
      this.form.resetFields();
      this.props.onUpdate(room);
    } catch (error) {
      console.error(error);
    }
  }
}
import { RoomEntitySaveStateDTO } from '@steggy/controller-shared';
import { is } from '@steggy/utilities';
import { Divider, Empty, Form, Skeleton, Space } from 'antd';
import React from 'react';

import { domain, sendRequest } from '../../../types';
import {
  EntityCardFan,
  EntityCardLight,
  EntityCardSwitch,
} from '../../entities';
import { FuzzySelect } from '../../misc';

type tState = {
  entities: string[];
};

export class EntityStateCommand extends React.Component<
  {
    command: RoomEntitySaveStateDTO;
    onUpdate: (command: Partial<RoomEntitySaveStateDTO>) => void;
  },
  tState
> {
  override state = {
    entities: [],
  } as tState;

  override async componentDidMount(): Promise<void> {
    await this.listEntities();
  }

  override render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Form.Item label="Entity">
          <FuzzySelect
            value={this.props.command?.ref}
            onChange={reference => this.props.onUpdate({ ref: reference })}
            style={{ width: '100%' }}
            data={this.state.entities.map(i => ({ text: i, value: i }))}
          />
        </Form.Item>
        <Divider orientation="left">State</Divider>
        {this.renderPicker()}
      </Space>
    );
  }

  private async listEntities(): Promise<void> {
    const entities = await sendRequest<string[]>({ url: `/entity/list` });
    this.setState({
      entities: entities.filter(i =>
        ['light', 'switch', 'fan', 'media_player', 'lock'].includes(domain(i)),
      ),
    });
  }

  private renderPicker() {
    if (is.empty(this.props.command?.ref)) {
      return <Empty />;
    }
    switch (domain(this.props.command?.ref)) {
      case 'light':
        return (
          <EntityCardLight
            onUpdate={update => this.props.onUpdate(update)}
            state={this.props.command}
          />
        );
      case 'media_player':
      case 'switch':
        return (
          <EntityCardSwitch
            onUpdate={update => this.props.onUpdate(update)}
            state={this.props.command}
          />
        );
      case 'fan':
        return (
          <EntityCardFan
            relative
            onUpdate={update => this.props.onUpdate(update)}
            state={this.props.command}
          />
        );
    }
    return <Skeleton />;
  }
}

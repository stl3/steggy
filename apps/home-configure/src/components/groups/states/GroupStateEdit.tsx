import { EditOutlined } from '@ant-design/icons';
import {
  GroupDTO,
  GroupSaveStateDTO,
  RoomEntitySaveStateDTO,
} from '@automagical/controller-shared';
import {
  ColorModes,
  FanAttributesDTO,
  LightAttributesDTO,
  LockAttributesDTO,
} from '@automagical/home-assistant-shared';
import {
  Button,
  Divider,
  Drawer,
  Layout,
  notification,
  Skeleton,
  Space,
  Spin,
  Typography,
} from 'antd';
import React from 'react';

import { sendRequest } from '../../../types';
import {
  FanEntityCard,
  LightEntityCard,
  LockEntityCard,
  SwitchEntityCard,
} from '../../entities';

export class GroupStateEdit extends React.Component<
  {
    group: GroupDTO;
    onUpdate: (group: GroupDTO) => void;
    state: GroupSaveStateDTO;
  },
  { dirty: boolean; drawer: boolean; friendlyName: string }
> {
  private cards: (
    | LightEntityCard
    | SwitchEntityCard
    | LockEntityCard
    | FanEntityCard
  )[];
  private get group() {
    return this.props.group;
  }

  private get entities(): string[] {
    return this.props.group.entities;
  }

  override componentDidMount(): void {
    this.setState({ friendlyName: this.props.state.friendlyName });
  }

  override render() {
    this.cards = [];
    return this.props.group ? (
      <>
        <Button
          size="small"
          type="text"
          onClick={() => this.setState({ drawer: true })}
        >
          <EditOutlined /> {this.props.state.friendlyName}
        </Button>
        <Drawer
          title={
            <Typography.Text
              editable={{
                onChange: friendlyName => this.setState({ friendlyName }),
              }}
            >
              {this.state?.friendlyName}
            </Typography.Text>
          }
          size="large"
          visible={this.state?.drawer}
          onClose={() => this.onClose(true)}
          extra={
            <Space>
              <Button type="primary" onClick={this.onSave.bind(this)}>
                Save
              </Button>
              <Button onClick={() => this.onClose(false)}>Cancel</Button>
            </Space>
          }
        >
          <Space direction="vertical">
            {this.bulkEdit()}
            <Divider orientation="left">Edit State</Divider>
            <Space wrap>
              {this.entities.map(entity => this.entityRender(entity))}
            </Space>
          </Space>
        </Drawer>
      </>
    ) : (
      <Layout.Content>
        <Spin size="large" tip="Loading..." />
      </Layout.Content>
    );
  }

  private bulkEdit() {
    switch (this.group.type) {
      case 'light':
        return (
          <LightEntityCard
            title="Bulk change"
            onUpdate={this.onStateChange.bind(this)}
          />
        );
      case 'switch':
        return (
          <SwitchEntityCard
            title="Bulk change"
            onUpdate={this.onStateChange.bind(this)}
          />
        );
      case 'fan':
        return (
          <FanEntityCard
            title="Bulk change"
            onUpdate={this.onStateChange.bind(this)}
          />
        );
      case 'lock':
        return (
          <LockEntityCard
            title="Bulk change"
            onUpdate={this.onStateChange.bind(this)}
          />
        );
    }
    return <Skeleton />;
  }

  private entityRender(entity: string) {
    const state = this.props?.state?.states?.find(
      ({ ref }) => ref === entity,
    ) || {
      extra: {},
      ref: entity,
      state: undefined,
    };
    switch (this.group.type) {
      case 'light':
        return (
          <LightEntityCard
            ref={i => this.cards.push(i)}
            key={entity}
            state={state}
            onUpdate={this.entityUpdate.bind(this)}
          />
        );
      case 'switch':
        return (
          <SwitchEntityCard
            ref={i => this.cards.push(i)}
            key={entity}
            state={state}
            onUpdate={this.entityUpdate.bind(this)}
          />
        );
      case 'fan':
        return (
          <FanEntityCard
            ref={i => this.cards.push(i)}
            key={entity}
            state={state}
            onUpdate={this.entityUpdate.bind(this)}
          />
        );
      case 'lock':
        return (
          <LockEntityCard
            ref={i => this.cards.push(i)}
            key={entity}
            state={state}
            onUpdate={this.entityUpdate.bind(this)}
          />
        );
    }
    return <Skeleton />;
  }

  private entityUpdate(): void {
    this.setState({ dirty: true });
  }

  private onClose(warn: boolean): void {
    if (this.state.dirty && warn) {
      notification.warn({
        description: `Changes to ${this.props.state.friendlyName} were not saved`,
        message: 'Unsaved changes',
      });
    }
    this.setState({ drawer: false });
  }

  private onFanChange(state: RoomEntitySaveStateDTO<FanAttributesDTO>): void {
    this.cards.forEach(card =>
      (card as FanEntityCard)?.setState({
        percentage: state.extra.percentage,
      }),
    );
  }

  private onLightStateChange(
    state: RoomEntitySaveStateDTO<LightAttributesDTO>,
    type: string,
  ): void {
    this.setState({ dirty: true });
    const set: LightAttributesDTO & { state?: string } = {};
    switch (type) {
      case 'state':
        set.state = state.state;
        if (state.extra.color_mode === 'color_temp') {
          set.color_mode = 'color_temp' as ColorModes;
        } else {
          set.rgb_color = state.extra.rgb_color;
          set.color_mode = 'hs' as ColorModes;
        }
        break;
      case 'brightness':
        set.brightness = state.extra.brightness;
        break;
      case 'color':
        set.state = 'on';
        set.rgb_color = state.extra.rgb_color;
        set.color_mode = 'hs' as ColorModes;
        break;
    }
    console.log(set);
    this.cards.forEach(i =>
      (i as LightEntityCard)?.setState(set as RoomEntitySaveStateDTO),
    );
  }

  private onLockChange(state: RoomEntitySaveStateDTO<LockAttributesDTO>): void {
    this.cards.forEach(card => {
      (card as LockEntityCard)?.setState({
        state: state.state,
      });
    });
  }

  private async onSave(): Promise<void> {
    const id = this.props.state.id;
    const group = await sendRequest<GroupDTO>({
      body: {
        friendlyName: this.state.friendlyName,
        id,
        states: this.cards.filter(i => !!i).map(i => i.getSaveState()),
      } as GroupSaveStateDTO,
      method: 'put',
      url: `/group/${this.group._id}/state/${id}`,
    });
    this.setState({ dirty: false, drawer: false });
    this.props.onUpdate(group);
  }

  private onStateChange(state: RoomEntitySaveStateDTO, type: string): void {
    this.setState({ dirty: true });
    switch (this.group.type) {
      case 'light':
        this.onLightStateChange(state, type);
        return;
      case 'switch':
        this.onSwitchStateChanged(state);
        return;
      case 'fan':
        this.onFanChange(state);
        return;
      case 'lock':
        this.onLockChange(state);
        return;
    }
  }

  private onSwitchStateChanged(state: RoomEntitySaveStateDTO): void {
    this.cards.forEach(i =>
      (i as SwitchEntityCard)?.setState({
        state: state.state,
      }),
    );
  }
}
import {
  GroupDTO,
  RoomEntitySaveStateDTO,
} from '@automagical/controller-shared';
import { SwitchStateDTO } from '@automagical/home-assistant-shared';
import { is } from '@automagical/utilities';
import { Col, Empty, Row } from 'antd';
import React from 'react';

import { sendRequest } from '../../types';
import { LockEntityCard } from '../entities';

type tStateType = { group: GroupDTO };

export class LockGroup extends React.Component<
  { group: GroupDTO; groupUpdate?: (group: GroupDTO) => void },
  tStateType
> {
  private lightCards: Record<string, LockEntityCard> = {};

  override render() {
    return (
      <Row gutter={[16, 16]}>
        {is.empty(this.props?.group?.state?.states) ? (
          <Col span={8} offset={8}>
            <Empty description="No entities in group" />
          </Col>
        ) : (
          this.props.group.state.states.map(entity => (
            <Col key={entity.ref}>
              <LockEntityCard
                state={entity}
                selfContained
                ref={reference => (this.lightCards[entity.ref] = reference)}
                onUpdate={this.onAttributeChange.bind(this)}
                onRemove={this.onRemove.bind(this)}
              />
            </Col>
          ))
        )}
      </Row>
    );
  }

  private async onAttributeChange(
    state: RoomEntitySaveStateDTO,
  ): Promise<void> {
    const entity = await sendRequest<SwitchStateDTO>(
      `/entity/command/${state.ref}/${state.state}`,
      { method: 'put' },
    );
    const card = this.lightCards[state.ref];
    card.setState({
      state: entity.state,
    });
  }

  private onRemove(entity_id: string): void {
    const { group } = this.props as { group: GroupDTO };
    group.entities = group.entities.filter(id => id !== entity_id);
    this.props.groupUpdate(group);
  }
}

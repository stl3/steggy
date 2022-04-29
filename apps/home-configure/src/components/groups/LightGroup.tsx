import { GroupDTO } from '@steggy/controller-shared';
import { is } from '@steggy/utilities';
import { Col, Empty, Row } from 'antd';

import { LightEntityCard } from '../entities';

export function LightGroup(props: {
  group: GroupDTO;
  groupUpdate?: (group: GroupDTO) => void;
}) {
  function onRemove(entity_id: string): void {
    props.group.entities = props.group.entities.filter(id => id !== entity_id);
    props.groupUpdate(props.group);
  }

  return (
    <Row gutter={[16, 16]}>
      {is.empty(props?.group?.state?.states) ? (
        <Col span={8} offset={8}>
          <Empty description="No entities in group" />
        </Col>
      ) : (
        props.group.state.states.map(entity => (
          <Col key={entity.ref}>
            <LightEntityCard
              state={entity}
              selfContained
              onRemove={id => onRemove(id)}
            />
          </Col>
        ))
      )}
    </Row>
  );
}

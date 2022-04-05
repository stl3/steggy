import PlusBoxMultiple from '@2fd/ant-design-icons/lib/PlusBoxMultiple';
import TimelinePlus from '@2fd/ant-design-icons/lib/TimelinePlus';
import { RoutineCommandDTO, RoutineDTO } from '@automagical/controller-shared';
import { Button, Drawer, Empty, List } from 'antd';
import React from 'react';

import { ROUTINE_COMMAND_LIST, sendRequest } from '../../../types';

type tState = {
  visible: boolean;
};

export class CommandAdd extends React.Component<
  {
    onCreate: (routine: RoutineDTO) => void;
    routine: RoutineDTO;
  },
  tState
> {
  override state = {} as tState;

  override render() {
    if (!this.props.routine) {
      return <Empty />;
    }
    return (
      <>
        <Drawer
          title="Add Command"
          visible={this.state.visible}
          onClose={() => this.setState({ visible: false })}
        >
          <List
            dataSource={ROUTINE_COMMAND_LIST}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={item.description}
                />
                <Button
                  icon={<TimelinePlus />}
                  type="primary"
                  shape="round"
                  onClick={() => this.addCommand(item.type, item.name)}
                />
              </List.Item>
            )}
          />
        </Drawer>
        <Button
          size="small"
          icon={<PlusBoxMultiple />}
          onClick={() => this.setState({ visible: true })}
        >
          Add new
        </Button>
      </>
    );
  }

  private async addCommand(type: string, name: string): Promise<void> {
    const routine = await sendRequest<RoutineDTO>({
      body: {
        friendlyName: `New ${name}`,
        type: type,
      } as Partial<RoutineCommandDTO>,
      method: 'post',
      url: `/routine/${this.props.routine._id}/command`,
    });
    this.props.onCreate(routine);
    this.setState({ visible: false });
  }
}
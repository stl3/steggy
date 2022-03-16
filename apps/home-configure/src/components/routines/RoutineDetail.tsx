import DebugStepIntoIcon from '@2fd/ant-design-icons/lib/DebugStepInto';
import PlusBoxMultiple from '@2fd/ant-design-icons/lib/PlusBoxMultiple';
import { CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { RoutineActivateDTO, RoutineDTO } from '@automagical/controller-shared';
import { TitleCase } from '@automagical/utilities';
import {
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  FormInstance,
  Input,
  Layout,
  List,
  Popconfirm,
  Popover,
  Row,
  Select,
  Spin,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

import { sendRequest } from '../../types';
import { CommandList } from './command';
import { RelatedRoutines } from './RelatedRoutines';
import { RoutineActivateDrawer } from './RoutineActivateDrawer';
import { RoutineCommandDrawer } from './RoutineCommandDrawer';

type tStateType = {
  name: string;
  routine: RoutineDTO;
};

export const RoutineDetail = withRouter(
  class extends React.Component<
    { id: string } & RouteComponentProps<{ id: string }>,
    tStateType
  > {
    static propTypes = {
      id: PropTypes.string,
    };
    private activateCreateForm: FormInstance;
    private activateDrawer: RoutineActivateDrawer;
    private commandCreateForm: FormInstance;
    private commandDrawer: RoutineCommandDrawer;

    private get id(): string {
      const { id } = this.props.match.params;
      return id;
    }

    override async componentDidMount(): Promise<void> {
      await this.refresh();
    }

    override render() {
      return (
        <Layout style={{ height: '100%' }} hasSider>
          {this.state?.routine ? (
            <>
              <Layout.Content style={{ margin: '16px' }}>
                <Breadcrumb>
                  <Breadcrumb.Item>
                    <Link to={`/routines`}>Routines</Link>
                  </Breadcrumb.Item>
                  <Breadcrumb.Item>
                    <Link to={`/routine/${this.state.routine._id}`}>
                      <Typography.Text
                        editable={{ onChange: name => this.nameUpdate(name) }}
                      >
                        {this.state.name}
                      </Typography.Text>
                    </Link>
                  </Breadcrumb.Item>
                </Breadcrumb>
                <Tabs type="card" style={{ margin: '16px 0 0 0' }}>
                  <Tabs.TabPane tab="Configuration" key="configuration">
                    <Row gutter={8}>
                      <Col span={12}>
                        <Card
                          type="inner"
                          title="Activation events"
                          extra={
                            <Popconfirm
                              onConfirm={this.validateActivate.bind(this)}
                              icon={
                                <QuestionCircleOutlined
                                  style={{ visibility: 'hidden' }}
                                />
                              }
                              title={
                                <Form
                                  onFinish={this.validateActivate.bind(this)}
                                  ref={form => (this.activateCreateForm = form)}
                                >
                                  <Form.Item
                                    label="Friendly Name"
                                    name="friendlyName"
                                    rules={[{ required: true }]}
                                  >
                                    <Input />
                                  </Form.Item>
                                  <Form.Item
                                    label="Type"
                                    name="type"
                                    rules={[{ required: true }]}
                                  >
                                    <Select>
                                      <Select.Option value="kunami">
                                        Sequence
                                      </Select.Option>
                                      <Select.Option value="schedule">
                                        Cron Schedule
                                      </Select.Option>
                                      <Select.Option value="state_change">
                                        State Change
                                      </Select.Option>
                                      <Select.Option value="solar">
                                        Solar Event
                                      </Select.Option>
                                    </Select>
                                  </Form.Item>
                                </Form>
                              }
                            >
                              <Button size="small" icon={<PlusBoxMultiple />}>
                                Add new
                              </Button>
                            </Popconfirm>
                          }
                        >
                          <List
                            dataSource={this.state.routine.activate}
                            renderItem={item => (
                              <List.Item
                                key={item.id}
                                onClick={() => this.activateDrawer.load(item)}
                              >
                                <List.Item.Meta
                                  title={
                                    <Typography.Text
                                      onClick={e => {
                                        e.stopPropagation();
                                      }}
                                      editable={{
                                        onChange: value =>
                                          this.renameActivate(item, value),
                                      }}
                                    >
                                      {item.friendlyName}
                                    </Typography.Text>
                                  }
                                  description={
                                    <Button
                                      onClick={() =>
                                        this.activateDrawer.load(item)
                                      }
                                      type="text"
                                    >
                                      {TitleCase(
                                        item.type === 'kunami'
                                          ? 'sequence'
                                          : item.type,
                                      )}
                                    </Button>
                                  }
                                />
                                <Popconfirm
                                  icon={
                                    <QuestionCircleOutlined
                                      style={{ color: 'red' }}
                                    />
                                  }
                                  title={`Are you sure you want to delete ${item.friendlyName}?`}
                                  onConfirm={e => {
                                    this.deleteActivate(item);
                                    e?.stopPropagation();
                                  }}
                                >
                                  <Button
                                    danger
                                    type="text"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <CloseOutlined />
                                  </Button>
                                </Popconfirm>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <CommandList
                          routine={this.state.routine}
                          onUpdate={routine => this.setState({ routine })}
                        />
                      </Col>
                    </Row>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Settings" key="settings">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Card
                          type="inner"
                          title="Settings"
                          style={{ height: '100%' }}
                        >
                          <Tooltip
                            title={
                              <Typography>
                                <Typography.Paragraph>
                                  When checked, a command action must fully
                                  complete prior to the next command running.
                                  This allows some commands, such as
                                  <Typography.Text code>
                                    Stop Processing
                                  </Typography.Text>
                                  to affect/prevent execution of following
                                  commands. Entity state changes require a
                                  confirmation from Home Assistant, which may be
                                  affected by real world conditions.
                                </Typography.Paragraph>
                                <Divider />
                                <Typography.Paragraph>
                                  While unchecked, actions will be initiated at
                                  the simultaniously, having no influence each
                                  other. Entity state changes are performed in a
                                  "fire and forget" manner.
                                </Typography.Paragraph>
                              </Typography>
                            }
                          >
                            <Checkbox
                              checked={this.state.routine.sync}
                              onChange={({ target }) =>
                                this.setSync(target.checked)
                              }
                            >
                              Synchronous command processing
                            </Checkbox>
                          </Tooltip>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card type="inner" title="Related Routines">
                          <RelatedRoutines routine={this.state.routine} />
                        </Card>
                      </Col>
                    </Row>
                  </Tabs.TabPane>
                </Tabs>
              </Layout.Content>
              <Layout.Sider style={{ padding: '16px' }}>
                <Popover
                  title="Activation endpoint"
                  content={
                    <Form.Item label="POST">
                      <Input value={`/routine/${this.id}`} readOnly />
                    </Form.Item>
                  }
                >
                  <Button
                    onClick={this.manualActivate.bind(this)}
                    icon={<DebugStepIntoIcon />}
                  >
                    Manual activate
                  </Button>
                </Popover>
              </Layout.Sider>
              <RoutineActivateDrawer
                routine={this.state.routine}
                onUpdate={this.refresh.bind(this)}
                ref={i => (this.activateDrawer = i)}
              />
            </>
          ) : (
            <Layout.Content>
              <Spin size="large" tip="Loading..." />
            </Layout.Content>
          )}
        </Layout>
      );
    }

    private async deleteActivate(item: RoutineActivateDTO): Promise<void> {
      const routine = await sendRequest<RoutineDTO>({
        method: 'delete',
        url: `/routine/${this.id}/activate/${item.id}`,
      });
      this.refresh(routine);
    }

    private async manualActivate(): Promise<void> {
      await sendRequest({
        method: 'post',
        url: `/routine/${this.id}`,
      });
    }

    private async nameUpdate(name: string): Promise<void> {
      if (name === this.state.routine.friendlyName) {
        return;
      }
      const routine = await sendRequest<RoutineDTO>({
        body: {
          friendlyName: name,
        },
        method: 'put',
        url: `/routine/${this.id}`,
      });
      this.setState({ name, routine });
    }

    private async refresh(routine?: RoutineDTO): Promise<void> {
      routine ??= await sendRequest<RoutineDTO>({ url: `/routine/${this.id}` });
      this.setState({ name: routine.friendlyName, routine });
    }

    private async renameActivate(
      activate: RoutineActivateDTO,
      friendlyName: string,
    ): Promise<void> {
      const { routine } = this.state;
      const updated = await sendRequest<RoutineDTO>({
        body: {
          activate: routine.activate.map(i =>
            i.id === activate.id
              ? {
                  ...activate,
                  friendlyName,
                }
              : i,
          ),
        },
        method: 'put',
        url: `/routine/${routine._id}`,
      });
      this.setState({ routine: updated });
    }

    private async setSync(sync: boolean) {
      const routine = await sendRequest<RoutineDTO>({
        body: { sync },
        method: 'put',
        url: `/routine/${this.state.routine._id}`,
      });
      this.setState({ routine });
    }

    private async validateActivate(): Promise<void> {
      try {
        const values = await this.activateCreateForm.validateFields();
        this.activateDrawer.load(values as RoutineActivateDTO);
      } catch (error) {
        console.error(error);
      }
    }
  },
);
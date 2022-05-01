import { HassStateDTO } from '@steggy/home-assistant-shared';
import { is } from '@steggy/utilities';
import {
  Button,
  Card,
  DatePicker,
  Form,
  notification,
  Popover,
  Table,
  Typography,
} from 'antd';
import { dump } from 'js-yaml';
import moment from 'moment';
import React, { useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { sendRequest } from '../../types';

export function EntityHistory(props: { entity: string }) {
  const [from, setFrom] = useState(moment().subtract(1, 'day'));
  const [to, setTo] = useState(moment());
  const [history, setHistory] = useState<HassStateDTO[]>([]);

  async function refresh(): Promise<void> {
    try {
      const history = await sendRequest<HassStateDTO[]>({
        body: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
        method: 'post',
        url: `/entity/history/${props.entity}`,
      });
      setHistory(history);
    } catch {
      notification.error({
        description: 'No history available?',
        message: 'Invalid history response',
      });
    }
  }

  function filterHistory() {
    let last: unknown;
    const filtered = history.filter(i => {
      if (i.state === last) {
        return false;
      }
      last = i.state;
      return true;
    });
    return filtered;
  }

  return (
    <Card
      type="inner"
      title={<Typography.Text strong>History</Typography.Text>}
      style={{ marginTop: '16px' }}
      extra={
        <Button
          type="primary"
          size="small"
          onClick={() => refresh()}
          disabled={is.empty(props.entity)}
        >
          Refresh
        </Button>
      }
    >
      <Form.Item label="Range">
        <DatePicker.RangePicker
          value={[from, to]}
          onChange={([from, to]: [moment.Moment, moment.Moment]) => {
            setFrom(from);
            setTo(to);
          }}
          onCalendarChange={([from, to]: [moment.Moment, moment.Moment]) => {
            setFrom(from);
            setTo(to);
          }}
          showTime
        />
      </Form.Item>
      <Table pagination={{ size: 'small' }} dataSource={filterHistory()}>
        <Table.Column
          title="State"
          dataIndex="state"
          key="state"
          render={(state, item: HassStateDTO) => (
            <Popover
              title={<Typography.Text strong>Attributes</Typography.Text>}
              content={
                <SyntaxHighlighter language="yaml" style={atomDark}>
                  {dump(item.attributes).trimEnd()}
                </SyntaxHighlighter>
              }
            >
              {state}
            </Popover>
          )}
        />
        <Table.Column
          title="Date Changed"
          dataIndex="last_changed"
          key="last_changed"
        />
      </Table>
    </Card>
  );
}

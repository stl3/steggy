import { RoutineRelativeDateComparisonDTO } from '@steggy/controller-shared';
import { Card, Divider, Form, Input, Radio, Tooltip, Typography } from 'antd';

import { ChronoExamples } from '../ChronoExamples';

export function RelativeDate(props: {
  comparison: RoutineRelativeDateComparisonDTO;
  onUpdate: (value: Partial<RoutineRelativeDateComparisonDTO>) => void;
}) {
  return (
    <>
      <Card title="Relative Date Comparison" type="inner">
        <Form.Item label="Comparison">
          <Tooltip
            title={
              <Typography>
                <Typography.Paragraph>
                  <Typography.Text code>before</Typography.Text>
                  {' / '}
                  <Typography.Text code>after</Typography.Text>: if the
                  expression results in a range, start date is used
                </Typography.Paragraph>
                <Divider />
                <Typography.Paragraph>
                  <Typography.Text code>in range</Typography.Text>: if the
                  expression does NOT result in a range, it will be treated the
                  same as <Typography.Text code>after</Typography.Text>
                </Typography.Paragraph>
                <Divider />
                <Typography.Paragraph>
                  <Typography.Text code>not in range</Typography.Text>: if the
                  expression does NOT result in a range, it will be treated the
                  same as <Typography.Text code>before</Typography.Text>
                </Typography.Paragraph>
              </Typography>
            }
          >
            <Radio.Group
              buttonStyle="solid"
              value={props.comparison.dateType}
              onChange={({ target }) =>
                props.onUpdate({ dateType: target.value })
              }
            >
              <Radio.Button value="after">After</Radio.Button>
              <Radio.Button value="before">Before</Radio.Button>
              <Radio.Button value="in_range">In Range</Radio.Button>
              <Radio.Button value="not_in_range">Not In Range</Radio.Button>
            </Radio.Group>
          </Tooltip>
        </Form.Item>
        <Form.Item label="Expression">
          <Input
            defaultValue={props.comparison.expression}
            onBlur={({ target }) =>
              props.onUpdate({ expression: target.value })
            }
          />
        </Form.Item>
        <Form.Item label="Current Value">
          {ChronoExamples.renderDateExpression(
            props.comparison.expression as string,
          )}
        </Form.Item>
      </Card>
      <ChronoExamples range />
    </>
  );
}

import { InfoCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip, Popover } from 'antd';

export function InfoIcon(props: { title?: string; children?: React.ReactNode; maxWidth?: number }) {
  return (
    <Popover
      overlayInnerStyle={{ maxWidth: props.maxWidth || 350 }}
      content={props.children}
      title={props.title}
      trigger={['hover', 'click']}
    >
      <QuestionCircleOutlined style={{ color: '#2bbe50' }} />
    </Popover>
  );
  // return (
  //   <Tooltip title={props.title}>
  //     <InfoCircleOutlined />
  //   </Tooltip>
  // );
}

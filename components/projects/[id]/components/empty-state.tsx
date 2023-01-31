import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import styled from 'styled-components';

const Title = styled.p`
  font-size: 24px;
  line-height: 34px;
  font-weight: 800;
  color: #000;
  margin-bottom: 24px;
`;

const Subtitle = styled(Title)`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
`;

const Placeholder = styled(Subtitle)`
  color: #6b6b6b;
  margin-top: 24px;
`;

const AddBlock = styled.div`
  border: 1px dashed black;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  border-radius: 8px;
`;

export function EmptyState({ onClick, label, message }: { onClick: () => void; label: string; message: string | JSX.Element }) {
  return (
    <AddBlock>
      <Button onClick={onClick} icon={<PlusOutlined />} type='primary' style={{ paddingRight: '4em', paddingLeft: '4em' }}>
        {label}
      </Button>
      <Placeholder>{message}</Placeholder>
    </AddBlock>
  );
}

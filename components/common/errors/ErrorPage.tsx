import { Typography } from 'antd';
import styled from 'styled-components';

//import Bolt from 'public/images/lightning_bolt.svg';

const Container = styled.div`
  align-self: stretch;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// const StyledBolt = styled(Bolt)`
//   margin: 0 auto;
//   position: relative;
//   left: -15px;
// `;

const Text = styled(Typography.Text)`
  font-size: 24px;
  font-weight: 700;
`;

export function ErrorPage({ message = 'Sorry! there was an error' }: { message?: string }) {
  return (
    <Container>
      <div style={{ textAlign: 'center' }} data-test='error-title'>
        {/* Box sx={{ */}
        <Text style={{ marginTop: 3 }}>{message}</Text>
      </div>
    </Container>
  );
}

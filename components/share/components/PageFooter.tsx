import Link from 'next/link';

import { Container as FooterContainer } from 'components/projects/[id]/components/Footer/styles';

export function PageFooter() {
  return (
    <FooterContainer style={{ justifyContent: 'center' }}>
      <em>
        Powered by Chart-Reuse, the world&apos;s only analytics tool for switching to reuse.{' '}
        <Link style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }} href='/signup'>
          Create a free account
        </Link>{' '}
        and get started
      </em>
    </FooterContainer>
  );
}

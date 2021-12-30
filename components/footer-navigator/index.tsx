import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Container, LinkBox, Row } from './styles'

type Props = {
  previousStepTitle?: string
  previousStepLinkSuffix?: string
  nextStepTitle?: string
  nextStepLinkSuffix?: string
}

const FooterNavigator: React.FC<Props> = props => {
  const { previousStepLinkSuffix, previousStepTitle, nextStepLinkSuffix, nextStepTitle } = props

  const { query } = useRouter()
  const projectId = query.id

  const previousStepLink = `/projects/${projectId}${previousStepLinkSuffix}`
  const nextStepLink = `/projects/${projectId}${nextStepLinkSuffix}`

  return (
    <Container>
      {previousStepLinkSuffix ? (
        <Row>
          <ArrowLeftOutlined css="margin-bottom: 5px" />
          <LinkBox>
            <span>Previous Step</span>
            <Link href={previousStepLink}>{previousStepTitle}</Link>
          </LinkBox>
        </Row>
      ) : (
        <div />
      )}

      {nextStepLinkSuffix ? (
        <Row>
          <LinkBox>
            <span>Next Step</span>
            <Link href={nextStepLink}>{nextStepTitle}</Link>
          </LinkBox>
          <ArrowRightOutlined css="margin-bottom: 5px" />
        </Row>
      ) : (
        <div />
      )}
    </Container>
  )
}

export default FooterNavigator

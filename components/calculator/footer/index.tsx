import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { createContext, useContext, useState } from 'react'
import { Container, LinkBox, Row } from './styles'

const CALCULATOR_STEPS = [
  { path: '/setup', title: 'Project Settings' },
  { path: '/single-use-items', title: 'Single-Use Purchasing' },
  { path: '/reusable-items', title: 'Reusables Purchasing' },
  { path: '/additional-costs', title: 'Additional Costs' },
  { path: '/projections', title: 'Projections' },
]

type ProjectPath = typeof CALCULATOR_STEPS[number]['path']
type FooterState = { path: ProjectPath; stepCompleted: boolean }

const FooterContext = createContext<{ state: FooterState | null, setFooterState: (state: FooterState) => void }>({
  setFooterState: () => {},
  state: null
})
export const useFooterState = () => useContext(FooterContext)

export function FooterProvider ({ children }: { children: React.ReactNode }) {
  const [state, setFooterState] = useState<FooterState>({ path: '/setup', stepCompleted: false })

  return (
    <FooterContext.Provider value={{ state, setFooterState }}>
      {children}
    </FooterContext.Provider>
  )
}

export default function Footer () {
  const { state } = useFooterState()

  const { query } = useRouter()
  const projectId = query.id as string

  const stepIndex = CALCULATOR_STEPS.findIndex(step => step.path === state?.path)
  if (stepIndex === -1) {
    return null
  }
  const previousStep = stepIndex > 0 ? CALCULATOR_STEPS[stepIndex - 1] : undefined
  const nextStep = stepIndex < CALCULATOR_STEPS.length - 1 ? CALCULATOR_STEPS[stepIndex + 1] : undefined

  return (

    <Container>
    {previousStep ? (
      <Row>
        <ArrowLeftOutlined css="margin-bottom: 5px" />
        <Link href={getLink(projectId, previousStep.path)}>
          <LinkBox>
            <span>Previous Step</span>
            <span className='page-title'>{previousStep.title}</span>
          </LinkBox>
        </Link>
      </Row>
    ) : (
      <div />
    )}

    {nextStep ? (
      <Row>
        <Link href={getLink(projectId, nextStep.path)}>
          <LinkBox>
            <span>Next Step</span>
            <span className='page-title'>{nextStep.title}</span>
          </LinkBox>
        </Link>
        <ArrowRightOutlined css="margin-bottom: 5px" />
      </Row>
    ) : (
      <div />
    )}
  </Container>
  )

}

function getLink (projectId: string, path: string) {
  return `/projects/${projectId}${path}`
}

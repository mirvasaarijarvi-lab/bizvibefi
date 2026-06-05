/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  eventTitle?: string
  programItems?: string[]
  feedbackUrl?: string
}

const EventFeedback = ({
  name = '',
  eventTitle = 'the event',
  programItems = [],
  feedbackUrl = 'https://goodvibescafe.org',
}: Props) => {
  const ratings = [1, 2, 3, 4, 5]
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>How was {eventTitle}? Share your feedback</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>How was it?</Heading>
          <Text style={text}>
            {name ? `Hi ${name}, ` : 'Hi, '}thanks for joining{' '}
            <strong>{eventTitle}</strong>. Your feedback helps us shape
            future sessions.
          </Text>

          <Text style={text}>
            <strong>Quick rating</strong>, tap a score for your overall
            experience:
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '8px 0 20px' }}>
            {ratings.map((r) => (
              <Link
                key={r}
                href={`${feedbackUrl}${feedbackUrl.includes('?') ? '&' : '?'}r=${r}`}
                style={ratingPill}
              >
                {r}
              </Link>
            ))}
          </Section>

          {programItems.length > 0 ? (
            <Section style={detailsCard}>
              <Text style={detailLabel}>Program highlights to rate</Text>
              {programItems.slice(0, 8).map((item, i) => (
                <Text key={i} style={programItem}>
                  • {item}
                </Text>
              ))}
            </Section>
          ) : null}

          <Section style={{ textAlign: 'center' as const, margin: '8px 0 20px' }}>
            <Button style={button} href={feedbackUrl}>
              Open feedback form
            </Button>
          </Section>

          <Section style={joinCard}>
            <Text style={joinText}>
              Stay in the loop with the latest news, discussions and
              vibecoding insights. We recommend joining{' '}
              <strong>&lt;Good Vibes Café/&gt;</strong> as a Starter or Viber
              member.
            </Text>
            <Button style={joinButton} href="https://goodvibescafe.org/membership">
              Join the community
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Good Vibes Café</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: EventFeedback,
  subject: (data: Props) =>
    `How was ${data.eventTitle || 'the event'}? Share your feedback`,
  displayName: 'Event feedback (24h after)',
  previewData: {
    name: 'Jane',
    eventTitle: 'Coffee & Code',
    programItems: [
      'Opening keynote',
      'Vibecoding workshop',
      'Community demos',
      'Networking session',
    ],
    feedbackUrl: 'https://goodvibescafe.org/events/123/feedback?token=abc&email=jane%40example.com',
  },
} satisfies TemplateEntry

export default EventFeedback

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const h1 = {
  fontSize: '26px',
  fontWeight: 700 as const,
  fontFamily: "'Poppins', Arial, sans-serif",
  color: 'hsl(240, 30%, 5%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(240, 10%, 25%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const detailsCard = {
  backgroundColor: 'hsl(45, 100%, 96%)',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '20px 0',
}
const detailLabel = {
  fontSize: '11px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: 'hsl(35, 80%, 35%)',
  margin: '0 0 10px',
  fontWeight: 600 as const,
}
const programItem = {
  fontSize: '14px',
  color: 'hsl(240, 30%, 5%)',
  margin: '4px 0',
  lineHeight: '1.5',
}
const ratingPill = {
  display: 'inline-block',
  width: '40px',
  height: '40px',
  lineHeight: '40px',
  margin: '0 6px',
  textAlign: 'center' as const,
  borderRadius: '20px',
  backgroundColor: 'hsl(270, 95%, 58%)',
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: 600 as const,
}
const button = {
  backgroundColor: 'hsl(270, 95%, 58%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const hr = { borderColor: 'hsl(248, 18%, 90%)', margin: '24px 0' }
const footer = { fontSize: '13px', color: 'hsl(270, 95%, 58%)', fontWeight: 600 as const, margin: 0 }
const joinCard = {
  backgroundColor: 'hsl(248, 30%, 97%)',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0 0',
  textAlign: 'center' as const,
}
const joinText = {
  fontSize: '14px',
  color: 'hsl(240, 10%, 25%)',
  lineHeight: '1.6',
  margin: '0 0 14px',
}
const joinButton = {
  backgroundColor: 'hsl(270, 95%, 58%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 600 as const,
  borderRadius: '10px',
  padding: '12px 22px',
  textDecoration: 'none',
}

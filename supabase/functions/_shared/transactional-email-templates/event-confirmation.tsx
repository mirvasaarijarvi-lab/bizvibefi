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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  eventTitle?: string
  eventIntro?: string
  eventTime?: string
  eventLocation?: string
  eventUrl?: string
}

const EventConfirmation = ({
  name = '',
  eventTitle = 'the event',
  eventIntro = '',
  eventTime = '',
  eventLocation = '',
  eventUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You are registered for {eventTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're registered</Heading>
        <Text style={text}>
          {name ? `Hi ${name}, ` : 'Hi, '}thanks for signing up for{' '}
          <strong>{eventTitle}</strong>. We look forward to seeing you.
        </Text>

        {eventIntro ? <Text style={text}>{eventIntro}</Text> : null}

        <Section style={detailsCard}>
          <Text style={detailLabel}>When</Text>
          <Text style={detailValue}>{eventTime || 'TBA'}</Text>
          <Hr style={innerHr} />
          <Text style={detailLabel}>Where</Text>
          <Text style={detailValue}>{eventLocation || 'TBA'}</Text>
        </Section>

        {eventUrl ? (
          <Button style={button} href={eventUrl}>
            View event details
          </Button>
        ) : null}

        <Section style={joinCard}>
          <Text style={joinText}>
            Stay in the loop with the latest news, discussions and vibecoding
            insights. We recommend joining{' '}
            <strong>&lt;Good Vibes Café/&gt;</strong> as a Starter or Viber member.
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

export const template = {
  component: EventConfirmation,
  subject: (data: Props) =>
    `Registration confirmed: ${data.eventTitle || 'Good Vibes Café event'}`,
  displayName: 'Event registration confirmation',
  previewData: {
    name: 'Jane',
    eventTitle: 'Coffee & Code',
    eventIntro: 'A casual evening of conversation, ideas, and good vibes.',
    eventTime: 'Thu, Jun 12, 2026 at 18:00',
    eventLocation: 'Café Aalto, Helsinki',
    eventUrl: 'https://goodvibescafe.org/events',
  },
} satisfies TemplateEntry

export default EventConfirmation

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
  backgroundColor: 'hsl(270, 100%, 97%)',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}
const detailLabel = {
  fontSize: '11px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: 'hsl(270, 73%, 41%)',
  margin: '0 0 4px',
  fontWeight: 600 as const,
}
const detailValue = {
  fontSize: '16px',
  color: 'hsl(240, 30%, 5%)',
  margin: '0 0 12px',
  fontWeight: 500 as const,
}
const innerHr = { borderColor: 'hsl(270, 100%, 92%)', margin: '12px 0' }
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

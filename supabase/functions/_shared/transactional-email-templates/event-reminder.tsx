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
  Img,
  Link,
  Preview,
  Section,
} from 'npm:@react-email/components@0.0.22'
import { Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  eventTitle?: string
  eventIntro?: string
  eventTime?: string
  eventLocation?: string
  eventUrl?: string
}

const ASSET_BASE = 'https://goodvibescafe.org'
const PARTNERS_LOGOS_URL =
  ASSET_BASE +
  '/__l5e/assets-v1/4a7a4839-34b3-4996-b85d-a90ed130e045/partners-sponsors.jpg'
const GVC_LOGO_URL =
  ASSET_BASE +
  '/__l5e/assets-v1/2f6c917d-b38c-49a8-86ff-b3a90b6ae40f/gvc-logo-white.jpg'

const EventReminder = ({
  name = '',
  eventTitle = 'the event',
  eventIntro = '',
  eventTime = '',
  eventLocation = '',
  eventUrl = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Warm welcome tomorrow: {eventTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>A warm welcome tomorrow</Heading>
        <Text style={text}>
          {name ? `Hi ${name}, ` : 'Hi, '}we cannot wait to see you at{' '}
          <strong>{eventTitle}</strong>. Thank you for registering, here is
          everything you need to know.
        </Text>

        {eventIntro ? <Text style={text}>{eventIntro}</Text> : null}

        <Section style={detailsCard}>
          <Text style={detailLabel}>When</Text>
          <Text style={detailValue}>{eventTime || 'TBA'}</Text>
          <Hr style={innerHr} />
          <Text style={detailLabel}>Where</Text>
          <Text style={detailValue}>{eventLocation || 'TBA'}</Text>
        </Section>

        <Text style={text}>
          The full agenda and speaker line-up are on the event page, please
          take a moment to skim them before arriving.
        </Text>

        {eventUrl ? (
          <Button style={button} href={eventUrl}>
            View agenda and speakers
          </Button>
        ) : null}

        <Heading as="h2" style={h2}>
          Two on-site competitions
        </Heading>

        <Section style={competitionCard}>
          <Text style={competitionTitle}>1. Social media share</Text>
          <Text style={competitionBody}>
            Share images and posts from the event on LinkedIn, tag{' '}
            <strong>&lt;Good Vibes Café/&gt;</strong> and use the hashtag{' '}
            <strong>#goodvibescafe</strong>. The post with the most engagement
            wins a reward.
          </Text>
        </Section>

        <Section style={competitionCard}>
          <Text style={competitionTitle}>2. Vibecoding demo</Text>
          <Text style={competitionBody}>
            Use the Lovable sponsored credits to build a demo and submit it to
            the{' '}
            <Link href="https://goodvibescafe.org/showcase" style={inlineLink}>
              &lt;Good Vibes Café/&gt; Showcases
            </Link>
            . The jury will pick the most innovative demo and reward the
            builder.
          </Text>
        </Section>

        <Section style={joinCard}>
          <Text style={joinText}>
            Stay in the loop with the latest news, discussions and vibecoding
            insights. Join the collective as a Starter or Viber member.
          </Text>
          <Button style={joinButton} href="https://goodvibescafe.org/get-going">
            Join the collective
          </Button>
        </Section>

        <Hr style={hr} />

        <Section style={partnerSection}>
          <Img
            src={PARTNERS_LOGOS_URL}
            alt="In cooperation with Business Turku and Turku Startup-hub. Sponsored by Lovable."
            width="520"
            style={partnerImg}
          />
        </Section>

        <Section style={brandSection}>
          <Img
            src={GVC_LOGO_URL}
            alt="Good Vibes Café"
            width="220"
            style={brandImg}
          />
        </Section>

        <Text style={footer}>Good Vibes Café</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EventReminder,
  subject: (data: Props) =>
    `See you tomorrow at ${data.eventTitle || 'Good Vibes Café'}`,
  displayName: 'Event reminder (24h before)',
  previewData: {
    name: 'Jane',
    eventTitle: 'Good Vibes Café',
    eventIntro:
      'In cooperation with Startup Hub Turku and Business Turku. A casual afternoon of building, demos and good vibes.',
    eventTime: 'Wed, Jun 10, 2026 at 10:00',
    eventLocation: 'EDU 1001 Dromberg, Joukahaisenkatu 7, 20520 Turku',
    eventUrl: 'https://goodvibescafe.org/events',
  },
} satisfies TemplateEntry

export default EventReminder

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const h1 = {
  fontSize: '26px',
  fontWeight: 700 as const,
  fontFamily: "'Poppins', Arial, sans-serif",
  color: 'hsl(240, 30%, 5%)',
  margin: '0 0 20px',
}
const h2 = {
  fontSize: '20px',
  fontWeight: 700 as const,
  fontFamily: "'Poppins', Arial, sans-serif",
  color: 'hsl(240, 30%, 5%)',
  margin: '32px 0 12px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(240, 10%, 25%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const detailsCard = {
  backgroundColor: 'hsl(170, 85%, 95%)',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}
const detailLabel = {
  fontSize: '11px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: 'hsl(173, 100%, 24%)',
  margin: '0 0 4px',
  fontWeight: 600 as const,
}
const detailValue = {
  fontSize: '16px',
  color: 'hsl(240, 30%, 5%)',
  margin: '0 0 12px',
  fontWeight: 500 as const,
}
const innerHr = { borderColor: 'hsl(170, 85%, 85%)', margin: '12px 0' }
const button = {
  backgroundColor: 'hsl(270, 95%, 58%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const competitionCard = {
  backgroundColor: 'hsl(270, 60%, 97%)',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '0 0 14px',
  borderLeft: '3px solid hsl(270, 95%, 58%)',
}
const competitionTitle = {
  fontSize: '15px',
  fontWeight: 700 as const,
  color: 'hsl(270, 80%, 30%)',
  margin: '0 0 6px',
  fontFamily: "'Poppins', Arial, sans-serif",
}
const competitionBody = {
  fontSize: '14px',
  color: 'hsl(240, 10%, 25%)',
  lineHeight: '1.6',
  margin: 0,
}
const inlineLink = {
  color: 'hsl(270, 95%, 58%)',
  textDecoration: 'underline',
}
const hr = { borderColor: 'hsl(248, 18%, 90%)', margin: '24px 0' }
const footer = {
  fontSize: '13px',
  color: 'hsl(270, 95%, 58%)',
  fontWeight: 600 as const,
  margin: '8px 0 0',
  textAlign: 'center' as const,
}
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
const partnerSection = {
  textAlign: 'center' as const,
  margin: '8px 0 0',
}
const partnerImg = {
  width: '100%',
  maxWidth: '520px',
  height: 'auto',
  borderRadius: '12px',
  display: 'block',
  margin: '0 auto',
}
const brandSection = {
  textAlign: 'center' as const,
  margin: '16px 0 0',
}
const brandImg = {
  width: '100%',
  maxWidth: '220px',
  height: 'auto',
  borderRadius: '12px',
  display: 'block',
  margin: '0 auto',
}

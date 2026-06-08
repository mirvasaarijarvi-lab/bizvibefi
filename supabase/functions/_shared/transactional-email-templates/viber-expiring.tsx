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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  endsOn?: string
  daysRemaining?: number
}

const ASSET_BASE = 'https://goodvibescafe.org'
const GVC_LOGO_URL =
  ASSET_BASE +
  '/__l5e/assets-v1/2f6c917d-b38c-49a8-86ff-b3a90b6ae40f/gvc-logo-white.jpg'

const ViberExpiring = ({
  name = '',
  endsOn = '',
  daysRemaining = 14,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Viber membership ends on {endsOn}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Viber membership is ending soon</Heading>
        <Text style={text}>
          {name ? `Hi ${name}, ` : 'Hi, '}a friendly heads-up: your Viber
          membership at &lt;Good Vibes Café/&gt; ends in{' '}
          <strong>
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
          </strong>
          .
        </Text>

        <Section style={detailsCard}>
          <Text style={detailLabel}>Ends on</Text>
          <Text style={detailValue}>{endsOn || 'soon'}</Text>
        </Section>

        <Text style={text}>
          To keep your Viber benefits, including access to the Vault, member
          showcases and full forum, you can renew anytime. Reply to this email
          and we will sort it out.
        </Text>

        <Button style={button} href="https://goodvibescafe.org/get-going">
          Renew your Viber membership
        </Button>

        <Hr style={hr} />

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
  component: ViberExpiring,
  subject: (data: Props) =>
    `Your Viber membership ends ${data.endsOn ? `on ${data.endsOn}` : 'soon'}`,
  displayName: 'Viber membership expiring',
  previewData: {
    name: 'Jane',
    endsOn: '31 Dec 2026',
    daysRemaining: 14,
  },
} satisfies TemplateEntry

export default ViberExpiring

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
  margin: 0,
  fontWeight: 500 as const,
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
const brandSection = { textAlign: 'center' as const, margin: '16px 0 0' }
const brandImg = {
  width: '100%',
  maxWidth: '220px',
  height: 'auto',
  borderRadius: '12px',
  display: 'block',
  margin: '0 auto',
}
const footer = {
  fontSize: '13px',
  color: 'hsl(270, 95%, 58%)',
  fontWeight: 600 as const,
  margin: '8px 0 0',
  textAlign: 'center' as const,
}

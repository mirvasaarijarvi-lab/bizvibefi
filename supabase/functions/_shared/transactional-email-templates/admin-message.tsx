/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
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

interface AdminMessageProps {
  subject?: string
  bodyText?: string
  senderName?: string
  visibleRecipients?: string
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const AdminMessage = ({
  subject = 'Message from Good Vibes Café',
  bodyText = '',
  senderName = 'Good Vibes Café',
  visibleRecipients = '',
}: AdminMessageProps) => {
  const paragraphs = bodyText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{subject}</Heading>
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <Text key={i} style={text}>
                {p.split('\n').map((line, j, arr) => (
                  <React.Fragment key={j}>
                    {line}
                    {j < arr.length - 1 ? <br /> : null}
                  </React.Fragment>
                ))}
              </Text>
            ))
          ) : (
            <Text style={text}>{bodyText}</Text>
          )}
          {visibleRecipients ? (
            <>
              <Hr style={hr} />
              <Section>
                <Text style={meta}>
                  Sent to: {visibleRecipients}
                </Text>
              </Section>
            </>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>{senderName}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminMessage,
  subject: (data: AdminMessageProps) => data.subject || 'Message from Good Vibes Café',
  displayName: 'Admin message',
  previewData: {
    subject: 'Hello from Good Vibes Café',
    bodyText: 'This is a preview of an admin broadcast message.',
    senderName: 'Good Vibes Café',
    visibleRecipients: '',
  },
} satisfies TemplateEntry

export default AdminMessage

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const h1 = {
  fontSize: '24px',
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
  whiteSpace: 'pre-wrap' as const,
}
const hr = { borderColor: 'hsl(248, 18%, 90%)', margin: '24px 0' }
const meta = { fontSize: '12px', color: 'hsl(248, 18%, 50%)', margin: 0 }
const footer = { fontSize: '13px', color: 'hsl(270, 95%, 58%)', fontWeight: 600 as const, margin: 0 }

// Registry of transactional email templates.
import { template as adminMessage } from './admin-message.tsx'
import { template as eventConfirmation } from './event-confirmation.tsx'
import { template as eventReminder } from './event-reminder.tsx'
import { template as eventFeedback } from './event-feedback.tsx'
import { template as viberExpiring } from './viber-expiring.tsx'

export interface TemplateEntry {
  component: (props: Record<string, unknown>) => unknown
  subject: string | ((data: Record<string, unknown>) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'admin-message': adminMessage,
  'event-confirmation': eventConfirmation,
  'event-reminder': eventReminder,
  'event-feedback': eventFeedback,
  'viber-expiring': viberExpiring,
}

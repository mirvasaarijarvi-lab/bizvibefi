// Registry of transactional email templates.
import { template as adminMessage } from './admin-message.tsx'
import { template as eventConfirmation } from './event-confirmation.tsx'
import { template as eventReminder } from './event-reminder.tsx'

export interface TemplateEntry {
  component: (props: any) => any
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'admin-message': adminMessage,
  'event-confirmation': eventConfirmation,
  'event-reminder': eventReminder,
}

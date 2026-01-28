// Utility functions for generating calendar links

interface CalendarEvent {
  title: string
  description: string
  location: string
  startTime: string // ISO string
  endTime: string // ISO string
  attendees?: string[]
}

/**
 * Format date for calendar URLs
 */
function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generate Google Calendar link
 */
export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const start = formatDateForCalendar(new Date(event.startTime))
  const end = formatDateForCalendar(new Date(event.endTime))
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${start}/${end}`,
  })

  if (event.attendees && event.attendees.length > 0) {
    params.append('add', event.attendees.join(','))
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Outlook Calendar link
 */
export function generateOutlookCalendarLink(event: CalendarEvent): string {
  const start = new Date(event.startTime).toISOString()
  const end = new Date(event.endTime).toISOString()
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: start,
    enddt: end,
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate ICS file content for Apple Calendar and other iCal-compatible apps
 */
export function generateICSFile(event: CalendarEvent): string {
  const start = formatDateForCalendar(new Date(event.startTime))
  const end = formatDateForCalendar(new Date(event.endTime))
  const now = formatDateForCalendar(new Date())
  
  // Generate a unique UID
  const uid = `${Date.now()}@khanflow.com`
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KhanFlow//Meeting Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
  ]

  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach(attendee => {
      icsContent.push(`ATTENDEE;CN=${attendee}:mailto:${attendee}`)
    })
  }

  icsContent.push('END:VEVENT', 'END:VCALENDAR')
  
  return icsContent.join('\r\n')
}

/**
 * Download ICS file
 */
export function downloadICSFile(event: CalendarEvent, filename: string = 'event.ics'): void {
  const icsContent = generateICSFile(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

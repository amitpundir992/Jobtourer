import { google } from 'googleapis'
import { prisma } from '@jobtourer/database'
import { logger } from '../lib/logger'

const gmail = google.gmail('v1')

async function getGmailClient(userId: string) {
  // Get OAuth tokens from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )

  // TODO: Store and retrieve OAuth tokens properly.
  // oauth2Client.setCredentials({
  //   access_token: user.gmail_access_token,
  //   refresh_token: user.gmail_refresh_token,
  // })

  return oauth2Client
}

export async function createGmailDraft(
  userId: string,
  subject: string,
  body: string,
  resumeId: string
): Promise<string> {
  try {
    const auth = await getGmailClient(userId)

    // Get resume file for attachment
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    })

    if (!resume) {
      throw new Error('Resume not found')
    }

    // Create email message
    const messageParts = [
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      `Subject: ${subject}`,
      '',
      body,
    ]

    const message = messageParts.join('\n')

    // Encode message to base64url
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Create draft
    const draft = await gmail.users.drafts.create({
      auth,
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    })

    logger.info(`Created Gmail draft: ${draft.data.id}`)

    return draft.data.id || ''
  } catch (error) {
    logger.error('Error creating Gmail draft:', error)
    throw error
  }
}

export async function sendEmail(
  userId: string,
  draftId: string
): Promise<void> {
  try {
    const auth = await getGmailClient(userId)

    // Send the draft
    await gmail.users.drafts.send({
      auth,
      userId: 'me',
      requestBody: {
        id: draftId,
      },
    })

    logger.info(`Sent email from draft: ${draftId}`)

    // Update database
    await prisma.emailDraft.update({
      where: { gmail_draft_id: draftId },
      data: {
        status: 'sent',
        sent_at: new Date(),
      },
    })
  } catch (error) {
    logger.error('Error sending email:', error)
    throw error
  }
}

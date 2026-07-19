import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { decryptToken, encryptToken } from '@jobtourer/config'
import { prisma } from '@jobtourer/database'
import { google } from 'googleapis'
import { logger } from '../lib/logger'

function resumePath(fileUrl: string) {
  const relative = fileUrl.replace(/^[/\\]+/, '')
  const configured = process.env.RESUME_PUBLIC_DIR
  const roots = [
    configured,
    path.resolve(process.cwd(), 'apps/web/public'),
    path.resolve(process.cwd(), '../../apps/web/public'),
  ].filter((root): root is string => Boolean(root))

  for (const root of roots) {
    const base = path.resolve(root)
    const candidate = path.resolve(base, relative)
    if (candidate.startsWith(`${base}${path.sep}`) && existsSync(candidate)) {
      return candidate
    }
  }
  throw new Error(`Resume file is unavailable at ${fileUrl}`)
}

function base64Lines(value: Buffer) {
  return (
    value
      .toString('base64')
      .match(/.{1,76}/g)
      ?.join('\r\n') ?? ''
  )
}

function encodeMessage(input: {
  from: string
  to: string
  subject: string
  body: string
  fileName: string
  fileType: string
  file: Buffer
}) {
  const boundary = `jobtourer-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject.replace(/[\r\n]+/g, ' ')}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    input.body,
    '',
    `--${boundary}`,
    `Content-Type: ${input.fileType || 'application/octet-stream'}; name="${input.fileName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${input.fileName}"`,
    '',
    base64Lines(input.file),
    `--${boundary}--`,
  ]

  return Buffer.from(lines.join('\r\n'))
    .toString('base64url')
    .replace(/=+$/, '')
}

async function gmailClient(userId: string) {
  const connection = await prisma.gmailConnection.findUnique({
    where: { user_id: userId },
  })
  if (!connection?.encrypted_refresh_token) {
    throw new Error('Gmail is not connected with offline access')
  }

  const client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )
  client.setCredentials({
    access_token: connection.encrypted_access_token
      ? decryptToken(connection.encrypted_access_token)
      : undefined,
    refresh_token: decryptToken(connection.encrypted_refresh_token),
    expiry_date: connection.access_token_expires_at?.getTime(),
  })
  client.on('tokens', (tokens) => {
    void prisma.gmailConnection.update({
      where: { user_id: userId },
      data: {
        encrypted_access_token: tokens.access_token
          ? encryptToken(tokens.access_token)
          : undefined,
        encrypted_refresh_token: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : undefined,
        access_token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
      },
    })
  })
  return { client, connection }
}

export async function createGmailDraft(userId: string, emailDraftId: string) {
  const draft = await prisma.emailDraft.findFirst({
    where: { id: emailDraftId, user_id: userId },
  })
  if (!draft?.recipient_email || !draft.resume_id) {
    throw new Error('Draft recipient or resume is missing')
  }
  const resume = await prisma.resume.findFirst({
    where: { id: draft.resume_id, user_id: userId },
  })
  if (!resume) throw new Error('Resume not found')

  const { client, connection } = await gmailClient(userId)
  const raw = encodeMessage({
    from: connection.email,
    to: draft.recipient_email,
    subject: draft.subject,
    body: draft.body,
    fileName: resume.file_name,
    fileType: resume.file_type,
    file: readFileSync(resumePath(resume.file_url)),
  })
  const result = await google.gmail('v1').users.drafts.create({
    auth: client,
    userId: 'me',
    requestBody: { message: { raw } },
  })
  if (!result.data.id) throw new Error('Gmail did not return a draft ID')

  await prisma.emailDraft.update({
    where: { id: draft.id },
    data: { gmail_draft_id: result.data.id, gmail_error: null },
  })
  logger.info(`Created Gmail draft ${result.data.id}`)
  return result.data.id
}

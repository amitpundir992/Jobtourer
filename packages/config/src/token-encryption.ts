import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'

function encryptionKey() {
  const encoded = process.env.TOKEN_ENCRYPTION_KEY
  if (!encoded) {
    throw new Error('TOKEN_ENCRYPTION_KEY is required for Gmail integration')
  }

  const key = Buffer.from(encoded, 'base64')
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key')
  }

  return key
}

export function encryptToken(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])

  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.')
}

export function decryptToken(value: string) {
  const [version, encodedIv, encodedTag, encodedValue] = value.split('.')
  if (version !== 'v1' || !encodedIv || !encodedTag || !encodedValue) {
    throw new Error('Encrypted token has an invalid format')
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(encodedIv, 'base64url')
  )
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(encodedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

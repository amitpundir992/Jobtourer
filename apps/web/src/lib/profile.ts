import { prisma } from '@jobtourer/database'

export async function ensureProfile(userId: string) {
  return prisma.profile.upsert({
    where: { user_id: userId },
    update: {},
    create: { user_id: userId },
  })
}

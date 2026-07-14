import { prisma } from '@jobtourer/database'
import { unstable_cache } from 'next/cache'

const getCachedUserProfile = unstable_cache(
  async (userId: string) => {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
    })

    return (
      profile ??
      prisma.profile.create({
        data: { user_id: userId },
      })
    )
  },
  ['user-profile-v1'],
  { revalidate: 60, tags: ['profile-data'] }
)

export function getUserProfile(userId: string) {
  return getCachedUserProfile(userId)
}

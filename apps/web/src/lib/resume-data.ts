import { prisma } from '@jobtourer/database'
import { unstable_cache } from 'next/cache'

const getCachedUserResumes = unstable_cache(
  (userId: string) =>
    prisma.resume.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    }),
  ['user-resumes-v1'],
  { revalidate: 60, tags: ['resume-data'] }
)

export function getUserResumes(userId: string) {
  return getCachedUserResumes(userId)
}

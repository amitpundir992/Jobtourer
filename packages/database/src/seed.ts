import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'test@jobtourer.com' },
    update: {},
    create: {
      email: 'test@jobtourer.com',
      password: hashedPassword,
      name: 'Test User',
      email_verified: true,
      subscription_tier: 'pro',
    },
  })

  console.log('Created test user:', user.email)

  const jobs = [
    {
      external_id: 'greenhouse-123',
      source: 'greenhouse',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp',
      description:
        'We are looking for an experienced full stack developer with expertise in React, Node.js, and PostgreSQL.',
      location: 'Remote',
      job_type: 'full-time',
      experience_level: 'senior',
      salary_min: 120000,
      salary_max: 180000,
      url: 'https://example.com/jobs/senior-fullstack',
      tags: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'],
    },
    {
      external_id: 'lever-456',
      source: 'lever',
      title: 'Frontend Engineer',
      company: 'StartupXYZ',
      description:
        'Join our team to build user interfaces with modern web technologies.',
      location: 'San Francisco, CA',
      job_type: 'full-time',
      experience_level: 'mid',
      salary_min: 100000,
      salary_max: 140000,
      url: 'https://example.com/jobs/frontend-engineer',
      tags: ['React', 'TypeScript', 'CSS', 'Next.js'],
    },
    {
      external_id: 'remoteok-789',
      source: 'remoteok',
      title: 'Backend Developer',
      company: 'CloudSolutions',
      description: 'Build scalable backend services with Node.js and AWS.',
      location: 'Remote',
      job_type: 'full-time',
      experience_level: 'mid',
      salary_min: 90000,
      salary_max: 130000,
      url: 'https://example.com/jobs/backend-developer',
      tags: ['Node.js', 'AWS', 'PostgreSQL', 'Docker'],
    },
  ]

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { external_id: job.external_id },
      update: {},
      create: job,
    })
  }

  console.log(`Created ${jobs.length} sample jobs`)

  const resume = await prisma.resume.create({
    data: {
      user_id: user.id,
      title: 'Software Engineer Resume',
      file_url: 'https://example.com/resumes/resume.pdf',
      file_name: 'resume.pdf',
      file_size: 245678,
      file_type: 'application/pdf',
      is_default: true,
      parsed_data: {
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        experience: [
          {
            title: 'Senior Developer',
            company: 'Previous Company',
            duration: '2020-2024',
          },
        ],
      },
    },
  })

  console.log('Created sample resume:', resume.title)
  console.log('Seeding completed')
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

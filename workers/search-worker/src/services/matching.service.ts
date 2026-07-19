import type { ParsedResumeData } from '@jobtourer/types'
import type { CandidateJob } from './job-search.service'

export interface MatchingProfile {
  preferred_role: string | null
  skills: string[]
  experience: string | null
  preferred_locations: string[]
  work_preference: string | null
  salary_min: number | null
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]/g, '')
}

function terms(value: string) {
  return value
    .split(/[,/\s-]+/)
    .map(normalize)
    .filter((term) => term.length > 2)
}

function remoteJob(job: CandidateJob) {
  return /remote|worldwide|anywhere|work from home/i.test(
    `${job.location} ${job.tags.join(' ')} ${job.jobType ?? ''}`
  )
}

function knownLocation(location: string) {
  return !/see job posting|not specified|multiple locations/i.test(location)
}

export function scoreCandidate(
  job: CandidateJob,
  profile: MatchingProfile,
  resume: ParsedResumeData
) {
  const skills = Array.from(
    new Set([...(profile.skills ?? []), ...(resume.skills ?? [])])
  ).filter(Boolean)
  const searchable = normalize(
    `${job.title} ${job.description} ${job.tags.join(' ')}`
  )
  const matchingSkills = skills.filter((skill) =>
    searchable.includes(normalize(skill))
  )
  const expectedSkillMatches = Math.max(1, Math.min(5, skills.length))
  const skillScore = Math.min(1, matchingSkills.length / expectedSkillMatches)

  const ignoredRoleTerms = new Set([
    'engineer',
    'engineering',
    'developer',
    'software',
    'role',
  ])
  const roleTerms = terms(profile.preferred_role ?? '').filter(
    (term) => !ignoredRoleTerms.has(term)
  )
  const normalizedTitle = normalize(job.title)
  const roleScore = roleTerms.length
    ? roleTerms.filter((term) => normalizedTitle.includes(term)).length /
      roleTerms.length
    : 0.5

  const wantsRemote =
    profile.work_preference?.toLowerCase() === 'remote' ||
    profile.preferred_locations.some((location) => /remote/i.test(location))
  const isRemote = remoteJob(job)
  if (wantsRemote && knownLocation(job.location) && !isRemote) {
    return { eligible: false, score: 0, matchingSkills, missingSkills: [] }
  }

  const preferredLocations = profile.preferred_locations.filter(
    (location) => !/remote/i.test(location)
  )
  const locationMatch =
    isRemote ||
    preferredLocations.length === 0 ||
    preferredLocations.some((location) =>
      job.location.toLowerCase().includes(location.toLowerCase())
    )
  const locationScore = locationMatch
    ? 1
    : knownLocation(job.location)
      ? 0
      : 0.5

  if (
    profile.salary_min &&
    job.salaryMax &&
    job.salaryMax < profile.salary_min
  ) {
    return { eligible: false, score: 0, matchingSkills, missingSkills: [] }
  }

  const profileExperience = normalize(profile.experience ?? '')
  const seniorJob = /\b(senior|staff|principal|lead|manager|director)\b/i.test(
    job.title
  )
  const seniorProfile =
    /senior|staff|principal|lead|manager|[5-9]\+?years/.test(profileExperience)
  const experienceScore = seniorJob ? (seniorProfile ? 1 : 0.25) : 1

  const score = Math.min(
    1,
    roleScore * 0.35 +
      skillScore * 0.4 +
      locationScore * 0.15 +
      experienceScore * 0.1
  )
  const normalizedSkills = new Set(skills.map(normalize))
  const missingSkills = job.tags
    .filter((tag) => !normalizedSkills.has(normalize(tag)))
    .filter((tag) => tag.length > 1)
    .slice(0, 8)

  return {
    eligible: roleScore > 0 || matchingSkills.length > 0,
    score,
    matchingSkills,
    missingSkills,
  }
}

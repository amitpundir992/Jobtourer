import type { ParsedResumeData } from '@jobtourer/types'

const skillKeywords = [
  'javascript',
  'typescript',
  'react',
  'next.js',
  'nextjs',
  'node.js',
  'nodejs',
  'express',
  'mongodb',
  'postgres',
  'postgresql',
  'mysql',
  'prisma',
  'tailwind',
  'html',
  'css',
  'git',
  'github',
  'docker',
  'aws',
  'redis',
  'graphql',
  'rest',
  'api',
  'python',
  'java',
  'c++',
  'sql',
]

const sectionAliases = {
  summary: ['summary', 'profile', 'objective', 'about'],
  skills: ['skills', 'technical skills', 'technologies'],
  experience: ['experience', 'work experience', 'professional experience'],
  education: ['education', 'academic background'],
  projects: ['projects', 'personal projects'],
}

type SectionName = keyof typeof sectionAliases

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getLines(text: string) {
  return normalizeWhitespace(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function findSectionForLine(line: string): SectionName | null {
  const cleaned = line.toLowerCase().replace(/[:|]/g, '').trim()

  for (const [section, aliases] of Object.entries(sectionAliases)) {
    if (aliases.includes(cleaned)) {
      return section as SectionName
    }
  }

  return null
}

function extractSections(text: string) {
  const sections: Partial<Record<SectionName, string[]>> = {}
  let activeSection: SectionName | null = null

  for (const line of getLines(text)) {
    const section = findSectionForLine(line)
    if (section) {
      activeSection = section
      sections[activeSection] ??= []
      continue
    }

    if (activeSection) {
      sections[activeSection]?.push(line)
    }
  }

  return sections
}

function splitCommaList(text: string) {
  return text
    .split(/[,|;/]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
}

function titleCaseSkill(skill: string) {
  const normalized = skill.trim()
  const lower = normalized.toLowerCase()

  if (lower === 'javascript') return 'JavaScript'
  if (lower === 'typescript') return 'TypeScript'
  if (lower === 'nextjs' || lower === 'next.js') return 'Next.js'
  if (lower === 'nodejs' || lower === 'node.js') return 'Node.js'
  if (lower === 'postgresql') return 'PostgreSQL'
  if (lower === 'api') return 'API'

  return normalized
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function unique(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  )
}

function extractSkills(text: string, sectionText?: string[]) {
  const explicitSkills = sectionText
    ? splitCommaList(sectionText.join(', '))
    : []
  const lowerText = text.toLowerCase()
  const detectedSkills = skillKeywords.filter((skill) =>
    lowerText.includes(skill)
  )

  return unique([...explicitSkills, ...detectedSkills])
    .map(titleCaseSkill)
    .slice(0, 30)
}

function extractSummary(sections: Partial<Record<SectionName, string[]>>) {
  const summary = sections.summary?.join(' ')
  if (!summary) return undefined
  return summary.slice(0, 700)
}

function extractFallbackSummary(text: string) {
  const ignoredPatterns = [
    /@/,
    /^\+?\d[\d\s()-]{7,}$/,
    /linkedin|github|portfolio/i,
  ]

  const lines = getLines(text).filter(
    (line) =>
      line.length > 30 &&
      line.length < 220 &&
      !ignoredPatterns.some((pattern) => pattern.test(line)) &&
      !findSectionForLine(line)
  )

  return lines.slice(0, 3).join(' ').slice(0, 700) || undefined
}

function linesToEntries(lines: string[] | undefined) {
  if (!lines?.length) return []

  return lines
    .join('\n')
    .split(/\n(?=[A-Z0-9][^\n]{3,})/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 10)
}

export async function extractResumeText(buffer: Buffer, fileType: string) {
  if (fileType === 'application/pdf') {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer) })

    try {
      const result = await parser.getText()
      return normalizeWhitespace(result.text)
    } finally {
      await parser.destroy()
    }
  }

  if (
    fileType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return normalizeWhitespace(result.value)
  }

  throw new Error('Unsupported resume file type')
}

export function parseResumeText(text: string): ParsedResumeData {
  if (!text.trim()) {
    return {
      parse_status: 'empty',
      parse_error:
        'No readable text was extracted. This resume may be scanned or image-based.',
      raw_text: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
    }
  }

  const sections = extractSections(text)
  const skills = extractSkills(text, sections.skills)
  const summary = extractSummary(sections) ?? extractFallbackSummary(text)
  const experience = linesToEntries(sections.experience).map((entry) => ({
    title: entry.split('\n')[0] ?? 'Experience',
    company: '',
    duration: '',
    description: entry,
  }))
  const education = linesToEntries(sections.education).map((entry) => ({
    degree: entry.split('\n')[0] ?? 'Education',
    institution: '',
    field_of_study: entry,
  }))
  const projects = linesToEntries(sections.projects)

  return {
    parse_status: 'parsed',
    raw_text: text,
    summary,
    skills,
    experience,
    education,
    projects,
  }
}

export async function parseResume(buffer: Buffer, fileType: string) {
  const text = await extractResumeText(buffer, fileType)
  return parseResumeText(text)
}

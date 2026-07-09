import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

interface AnimatedCodeBackgroundProps {
  className?: string
  intensity?: 'calm' | 'hero'
}

const codeLines = [
  'const match = await jobs.score(resume)',
  'if (match.score > 0.82) queue.apply()',
  'draft.email({ tone: "confident" })',
  'pipeline.sync("applications")',
  'resume.skills.map(skill => rank(skill))',
  'notify.when(status === "interview")',
]

const streamColumns = [
  ['AI', 'CV', 'JS', 'API', 'SQL', 'TS'],
  ['01', 'UX', 'ML', 'ATS', 'GO', 'DB'],
  ['PR', 'QA', 'CI', 'OK', 'HR', 'UI'],
]

export function AnimatedCodeBackground({
  className,
  intensity = 'calm',
}: AnimatedCodeBackgroundProps) {
  return (
    <div
      className={cn(
        'animated-code-bg',
        `animated-code-bg-${intensity}`,
        className
      )}
      aria-hidden="true"
    >
      <span className="animated-code-grid" />
      <span className="animated-code-beam animated-code-beam-one" />
      <span className="animated-code-beam animated-code-beam-two" />

      <div className="animated-code-lines">
        {codeLines.map((line, index) => (
          <span key={line} style={{ '--line-index': index } as CSSProperties}>
            {line}
          </span>
        ))}
      </div>

      <div className="animated-code-streams">
        {streamColumns.map((column, columnIndex) => (
          <div
            className="animated-code-stream"
            key={column.join('-')}
            style={{ '--stream-index': columnIndex } as CSSProperties}
          >
            {[...column, ...column].map((token, tokenIndex) => (
              <span key={`${token}-${tokenIndex}`}>{token}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

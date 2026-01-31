import type { FounderProfile } from '../types/profile'

interface CyberProfileCardProps {
  profile: FounderProfile
  onReset: () => void
}

export function CyberProfileCard({ profile, onReset }: CyberProfileCardProps) {
  return (
    <div className="cyber-panel rounded-lg overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[var(--panel-elevated)] px-4 py-3 border-b border-[var(--border-dim)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[var(--neon-green)]" />
          <span className="font-mono text-xs text-[var(--text-muted)]">IDENTITY_VERIFIED</span>
        </div>
        <button
          onClick={onReset}
          className="px-3 py-1 text-xs font-mono border border-[var(--border-dim)] rounded
                     hover:border-[var(--neon-magenta)] hover:text-[var(--neon-magenta)]
                     transition-colors glitch-hover"
        >
          [RESET]
        </button>
      </div>

      <div className="p-6">
        {/* Name & Summary */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-2xl font-bold neon-cyan">
              {profile.name || 'UNKNOWN_ENTITY'}
            </h2>
            <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--panel-elevated)] px-2 py-1 rounded">
              ID:{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </span>
          </div>
          {profile.location && (
            <p className="text-sm text-[var(--text-muted)] font-mono mb-3">
              {profile.location}
            </p>
          )}
          {profile.summary && (
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed border-l-2 border-[var(--neon-cyan)]/30 pl-4">
              {profile.summary}
            </p>
          )}
        </div>

        {/* Experience Section */}
        {profile.experience.length > 0 && (
          <div className="mb-6">
            <h3 className="font-mono text-xs text-[var(--neon-magenta)] mb-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[var(--neon-magenta)]" />
              EXPERIENCE_LOG
            </h3>
            <div className="space-y-3">
              {profile.experience.map((exp, i) => (
                <div key={i} className="pl-4 border-l border-[var(--border-dim)] hover:border-[var(--neon-cyan)] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{exp.title}</p>
                      <p className="text-sm text-[var(--neon-cyan)]">{exp.company}</p>
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {exp.start_year}{exp.end_year ? `—${exp.end_year}` : '—PRESENT'}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {profile.education.length > 0 && (
          <div className="mb-6">
            <h3 className="font-mono text-xs text-[var(--neon-amber)] mb-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[var(--neon-amber)]" />
              EDUCATION_DATA
            </h3>
            <div className="space-y-2">
              {profile.education.map((edu, i) => (
                <div key={i} className="flex items-start justify-between text-sm">
                  <div>
                    <p className="text-[var(--text-primary)]">{edu.institution}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {edu.degree}{edu.field_of_study ? ` // ${edu.field_of_study}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {edu.end_year || edu.start_year}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {profile.skills.length > 0 && (
          <div>
            <h3 className="font-mono text-xs text-[var(--neon-green)] mb-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[var(--neon-green)]" />
              SKILL_MATRIX
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs font-mono bg-[var(--panel-elevated)]
                             border border-[var(--border-dim)] rounded
                             hover:border-[var(--neon-green)] hover:text-[var(--neon-green)]
                             transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

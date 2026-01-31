import type { FounderProfile } from '../types/profile'

interface ProfileCardProps {
  profile: FounderProfile
  onReset: () => void
}

export function ProfileCard({ profile, onReset }: ProfileCardProps) {
  return (
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">{profile.name || 'Unknown Name'}</h2>
        {profile.location && <p className="text-blue-100 text-sm mt-1">{profile.location}</p>}
      </div>

      <div className="p-6 space-y-6">
        {/* Contact Info */}
        {(profile.email || profile.phone) && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {profile.email && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {profile.phone}
              </span>
            )}
          </div>
        )}

        {/* Summary */}
        {profile.summary && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Summary
            </h3>
            <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
          </div>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Experience
            </h3>
            <div className="space-y-4">
              {profile.experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-gray-200 pl-4">
                  <p className="font-medium text-gray-900">{exp.title}</p>
                  <p className="text-gray-600">{exp.company}</p>
                  {(exp.start_year || exp.end_year) && (
                    <p className="text-sm text-gray-500">
                      {exp.start_year} - {exp.end_year || 'Present'}
                    </p>
                  )}
                  {exp.description && (
                    <p className="text-gray-700 text-sm mt-1">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.education.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Education
            </h3>
            <div className="space-y-3">
              {profile.education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-gray-200 pl-4">
                  <p className="font-medium text-gray-900">{edu.institution}</p>
                  {(edu.degree || edu.field_of_study) && (
                    <p className="text-gray-600">
                      {[edu.degree, edu.field_of_study].filter(Boolean).join(' in ')}
                    </p>
                  )}
                  {(edu.start_year || edu.end_year) && (
                    <p className="text-sm text-gray-500">
                      {edu.start_year} - {edu.end_year || 'Present'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="pt-4 border-t">
          <button
            onClick={onReset}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Upload New CV
          </button>
        </div>
      </div>
    </div>
  )
}

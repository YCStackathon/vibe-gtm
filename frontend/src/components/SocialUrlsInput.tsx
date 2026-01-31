import type { SocialUrls } from '../types/profile'

interface SocialUrlsInputProps {
  urls: SocialUrls
  onChange: (urls: SocialUrls) => void
}

export function SocialUrlsInput({ urls, onChange }: SocialUrlsInputProps) {
  const handleChange = (field: keyof SocialUrls) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...urls, [field]: e.target.value })
  }

  const fields: { key: keyof SocialUrls; label: string; placeholder: string }[] = [
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
    { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/...' },
    { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
    { key: 'website', label: 'Website', placeholder: 'https://...' },
  ]

  return (
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Profiles</h3>
      <p className="text-sm text-gray-500 mb-4">
        Add your social profiles for additional context (optional)
      </p>
      <div className="space-y-4">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="url"
              value={urls[key] || ''}
              onChange={handleChange(key)}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

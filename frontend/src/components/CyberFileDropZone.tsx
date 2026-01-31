import { useCallback, useState } from 'react'

interface CyberFileDropZoneProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
}

export function CyberFileDropZone({ onFileSelect, isLoading }: CyberFileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files?.[0]) {
      if (files[0].type === 'application/pdf') {
        onFileSelect(files[0])
      }
    }
  }, [onFileSelect])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative cyber-panel rounded-lg p-8
        transition-all duration-300 cursor-pointer group
        ${isDragging ? 'glow-border-cyan scale-[1.02]' : 'hover:border-[var(--neon-cyan)]/50'}
        ${isLoading ? 'pointer-events-none' : ''}
      `}
    >
      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[var(--neon-cyan)]" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[var(--neon-cyan)]" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[var(--neon-cyan)]" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[var(--neon-cyan)]" />

      <label className="flex flex-col items-center cursor-pointer">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center py-8">
            {/* Loading Animation */}
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-2 border-[var(--neon-cyan)] rounded-full animate-ping opacity-20" />
              <div className="absolute inset-2 border-2 border-t-[var(--neon-magenta)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <div className="absolute inset-4 border-2 border-b-[var(--neon-cyan)] border-r-transparent border-t-transparent border-l-transparent rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">&#x21BB;</span>
              </div>
            </div>
            <p className="neon-cyan font-mono text-sm tracking-wider animate-pulse">
              EXTRACTING_IDENTITY...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            {/* Upload Icon */}
            <div className={`
              relative w-24 h-24 mb-6
              transition-transform duration-300
              ${isDragging ? 'scale-110' : 'group-hover:scale-105'}
            `}>
              {/* Hexagon Shape */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon
                  points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                  fill="none"
                  stroke="var(--neon-cyan)"
                  strokeWidth="1"
                  className={isDragging ? 'animate-pulse' : ''}
                />
                <polygon
                  points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5"
                  fill="var(--panel)"
                  stroke="var(--border-dim)"
                  strokeWidth="1"
                />
              </svg>
              {/* Upload Arrow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl ${isDragging ? 'neon-cyan' : 'text-[var(--text-muted)]'} transition-colors`}>
                  &#x2B06;
                </span>
              </div>
            </div>

            <h3 className="font-semibold text-lg mb-2">
              <span className="text-[var(--text-muted)]">&lt;</span>
              <span className={isDragging ? 'neon-cyan' : 'text-[var(--text-primary)]'}>
                {isDragging ? 'RELEASE_TO_UPLOAD' : 'DROP_CV.PDF'}
              </span>
              <span className="text-[var(--text-muted)]">/&gt;</span>
            </h3>

            <p className="text-[var(--text-secondary)] text-sm mb-4">
              or <span className="text-[var(--neon-cyan)] underline underline-offset-2">browse files</span>
            </p>

            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] font-mono">
              <span className="px-2 py-1 border border-[var(--border-dim)] rounded">PDF</span>
              <span>MAX_SIZE: 10MB</span>
            </div>
          </div>
        )}
      </label>
    </div>
  )
}

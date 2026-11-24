import { Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { isMuted, toggleMute, unlockAudio } from '../utils/sound'

/**
 * 우측 상단 음소거 토글.
 */
export function MuteButton() {
  const [muted, setMuted] = useState(isMuted)

  return (
    <button
      type="button"
      className="absolute right-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-sm border border-brass/30 bg-desk/70 text-brass/80"
      aria-label={muted ? '소리 켜기' : '음소거'}
      onClick={() => {
        void unlockAudio()
        setMuted(toggleMute())
      }}
    >
      {muted ? <VolumeX size={14} strokeWidth={1.75} /> : <Volume2 size={14} strokeWidth={1.75} />}
    </button>
  )
}

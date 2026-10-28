import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import './KaraokePlayer.css'

type LyricLine = { time: number; text: string }

const audioUrl = '/karaoke/Baby Can I Hold You.mp3'
const lyricsUrl = '/karaoke/Baby Can I Hold You.lrc'

function parseLrc(source: string): LyricLine[] {
  const lines: LyricLine[] = []
  const timestampPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g

  for (const rawLine of source.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(timestampPattern)]
    const text = rawLine.replace(timestampPattern, '').trim()
      .replace(/^\uFEFF/, '').replace(/^['“”](.*)['“”]$/, '$1')
    if (!text) continue

    for (const match of matches) {
      const fraction = match[3] ?? '0'
      const milliseconds = Number(fraction.padEnd(3, '0').slice(0, 3))
      lines.push({
        time: Number(match[1]) * 60 + Number(match[2]) + milliseconds / 1000,
        text,
      })
    }
  }

  return lines.sort((a, b) => a.time - b.time)
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

export default function KaraokePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const activeLineRef = useRef<HTMLButtonElement>(null)
  const [lrcText, setLrcText] = useState('')
  const [loadError, setLoadError] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(lyricsUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load the LRC lyrics file.')
        return response.text()
      })
      .then(setLrcText)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setLoadError(error.message)
      })
    return () => controller.abort()
  }, [])

  const lines = useMemo(() => parseLrc(lrcText), [lrcText])
  const activeIndex = useMemo(() => {
    let low = 0
    let high = lines.length - 1
    let found = -1
    while (low <= high) {
      const middle = Math.floor((low + high) / 2)
      if (lines[middle].time <= currentTime) {
        found = middle
        low = middle + 1
      } else {
        high = middle - 1
      }
    }
    return found
  }, [currentTime, lines])

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  const togglePlayback = async () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) await audioRef.current.play()
    else audioRef.current.pause()
  }

  const seekBy = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
  }

  const seekTo = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time
  }

  return (
    <section className="music-container karaoke-page" aria-labelledby="perform-heading">
      <header className="karaoke-heading">
        <div>
          <p className="music-eyebrow">PERFORM</p>
          <h2 id="perform-heading">Karaoke</h2>
          <p className="karaoke-subtitle">Baby Can I Hold You</p>
        </div>
        <span className="karaoke-badge">LINE-SYNCED LYRICS</span>
      </header>

      <div className="karaoke-stage" aria-live="off">
        {loadError ? (
          <p className="karaoke-status" role="alert">{loadError}</p>
        ) : lines.length === 0 ? (
          <p className="karaoke-status">Loading timed lyrics…</p>
        ) : (
          <div className="karaoke-lyrics" aria-label="Timed lyrics">
            {lines.map((line, index) => (
              <button
                className={`karaoke-line${index === activeIndex ? ' is-active' : ''}${index < activeIndex ? ' is-past' : ''}`}
                key={`${line.time}-${index}`}
                type="button"
                onClick={() => seekTo(line.time)}
                ref={index === activeIndex ? activeLineRef : undefined}
                aria-current={index === activeIndex ? 'true' : undefined}
                title={`Seek to ${formatTime(line.time)}`}
              >
                {line.text}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="karaoke-controls">
        <div className="karaoke-transport">
          <button type="button" className="karaoke-skip" onClick={() => seekBy(-5)} aria-label="Back 5 seconds"><RotateCcw /><span>5</span></button>
          <button type="button" className="karaoke-play" onClick={togglePlayback} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
          <button type="button" className="karaoke-skip" onClick={() => seekBy(5)} aria-label="Forward 5 seconds"><RotateCw /><span>5</span></button>
        </div>
        <div className="karaoke-timeline">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seekTo(Number(event.target.value))}
            aria-label="Seek through the song"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setLoadError('Could not load the karaoke MP3.')}
      />
      <p className="karaoke-hint">Tap any lyric line to jump to that point in the song.</p>
    </section>
  )
}

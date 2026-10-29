import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Drum, Guitar, Mic2, Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import './KaraokePlayer.css'

type LyricLine = { time: number; text: string }

const karaokeSongs = [
  { id: 'baby-can-i-hold-you', title: 'Baby Can I Hold You', audio: '/karaoke/Baby Can I Hold You.mp3', lyrics: '/karaoke/Baby Can I Hold You.lrc', stems: [
    { id: 'vocal', label: 'Vocals', src: '/karaoke/Baby Can I Hold You_vocal.ogg', icon: Mic2 },
    { id: 'drums', label: 'Drums', src: '/karaoke/Baby Can I Hold You_drums.ogg', icon: Drum },
    { id: 'bass', label: 'Bass', src: '/karaoke/Baby Can I Hold You_bass.ogg', icon: Guitar },
    { id: 'others', label: 'Other instruments', src: '/karaoke/Baby Can I Hold You_others.ogg', icon: AudioLines },
  ] },
  { id: 'on-and-on', title: 'On and On', audio: '/karaoke/On and On.mp3', lyrics: '/karaoke/On and On.lrc', stems: [] },
]

function parseLrc(source: string): LyricLine[] {
  const lines: LyricLine[] = []
  const timestampPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g

  for (const rawLine of source.split(/\r?\n/)) {
    const matches = [...rawLine.matchAll(timestampPattern)]
    const text = rawLine.replace(timestampPattern, '').trim()
      .replace(/^\uFEFF/, '')
      .replace(/\[(?:ar|ti|al|length|by|re|ve|offset):[^\]]*\]/gi, '')
      .trim().replace(/^['“”](.*)['“”]$/, '$1')
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
  const audioContextRef = useRef<AudioContext | null>(null)
  const stemBuffersRef = useRef<Record<string, AudioBuffer>>({})
  const stemSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const mixClockRef = useRef({ startedAt: 0, offset: 0 })
  const animationRef = useRef<number | null>(null)
  const switchingMixRef = useRef(false)
  const lyricsWindowRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLButtonElement>(null)
  const [selectedSongId, setSelectedSongId] = useState(karaokeSongs[0].id)
  const selectedSong = karaokeSongs.find((song) => song.id === selectedSongId) ?? karaokeSongs[0]
  const [lrcText, setLrcText] = useState('')
  const [loadError, setLoadError] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [enabledStems, setEnabledStems] = useState<string[]>(selectedSong.stems.map((stem) => stem.id))
  const [mixTime, setMixTime] = useState(0)

  const isOriginalMix = enabledStems.length === selectedSong.stems.length
  const getMixTime = () => {
    const context = audioContextRef.current
    if (!isOriginalMix) {
      if (isPlaying && context) return mixClockRef.current.offset + Math.max(0, context.currentTime - mixClockRef.current.startedAt)
      return currentTime
    }
    return audioRef.current?.currentTime ?? currentTime
  }

  const stopStemSources = (savePosition = true) => {
    const context = audioContextRef.current
    if (savePosition && context && stemSourcesRef.current.length) {
      const time = mixClockRef.current.offset + Math.max(0, context.currentTime - mixClockRef.current.startedAt)
      setMixTime(time)
      setCurrentTime(time)
    }
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    animationRef.current = null
    stemSourcesRef.current.forEach((source) => {
      source.onended = null
      try { source.stop() } catch { /* A source may already have ended. */ }
    })
    stemSourcesRef.current = []
  }

  const playStemMix = async (offset: number) => {
    if (!selectedSong.stems.length) return
    const context = audioContextRef.current ?? new AudioContext()
    audioContextRef.current = context
    await context.resume()
    const stems = selectedSong.stems.filter((stem) => enabledStems.includes(stem.id))
    const buffers = await Promise.all(stems.map(async (stem) => {
      if (stemBuffersRef.current[stem.id]) return stemBuffersRef.current[stem.id]
      const response = await fetch(stem.src)
      if (!response.ok) throw new Error(`Could not load the ${stem.label.toLowerCase()} track.`)
      const buffer = await context.decodeAudioData(await response.arrayBuffer())
      stemBuffersRef.current[stem.id] = buffer
      return buffer
    }))
    if (!buffers.length) return
    setDuration(Math.min(...buffers.map((buffer) => buffer.duration)))
    stopStemSources(false)
    const startAt = context.currentTime + 0.08
    const sources = buffers.map((buffer) => {
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      source.start(startAt, Math.min(offset, Math.max(0, buffer.duration - 0.01)))
      return source
    })
    mixClockRef.current = { startedAt: startAt, offset }
    stemSourcesRef.current = sources
    const tick = () => {
      const time = mixClockRef.current.offset + Math.max(0, context.currentTime - mixClockRef.current.startedAt)
      setCurrentTime(time)
      if (time >= Math.min(...buffers.map((buffer) => buffer.duration))) {
        stopStemSources(false)
        setMixTime(0)
        setCurrentTime(0)
        setIsPlaying(false)
        return
      }
      animationRef.current = requestAnimationFrame(tick)
    }
    animationRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    stopStemSources(false)
    audioRef.current?.pause()
    audioRef.current?.load()
    setEnabledStems(selectedSong.stems.map((stem) => stem.id))
    setMixTime(0)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
  }, [selectedSong.id])

  useEffect(() => {
    switchingMixRef.current = false
    if (isOriginalMix) {
      if (audioRef.current) {
        audioRef.current.currentTime = mixTime
        if (isPlaying) void audioRef.current.play().catch(() => setLoadError('Could not play the selected audio tracks.'))
      }
    } else if (isPlaying && selectedSong.stems.length) {
      void playStemMix(mixTime).catch((error: Error) => setLoadError(error.message))
    }
  }, [enabledStems, selectedSong.id])

  useEffect(() => {
    const controller = new AbortController()
    setLrcText('')
    setLoadError('')
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    audioRef.current?.pause()
    fetch(selectedSong.lyrics, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load the LRC lyrics file.')
        return response.text()
      })
      .then(setLrcText)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setLoadError(error.message)
      })
    return () => controller.abort()
  }, [selectedSong.lyrics])

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
    const activeLine = activeLineRef.current
    const lyricsWindow = activeLine?.parentElement
    if (!activeLine || !lyricsWindow) return
    if (activeIndex <= 0) {
      lyricsWindow.scrollTop = 0
      return
    }
    const lineTop = activeLine.getBoundingClientRect().top - lyricsWindow.getBoundingClientRect().top
    const lineBottom = lineTop + activeLine.offsetHeight
    // Let the song open at its first sung word. Only scroll once the active
    // lyric approaches the lower part of the window, leaving upcoming lines visible.
    if (lineBottom < lyricsWindow.clientHeight * 0.68) return
    const targetTop = lyricsWindow.scrollTop + lineTop - lyricsWindow.clientHeight * 0.36
    lyricsWindow.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  }, [activeIndex])

  useEffect(() => {
    if (lyricsWindowRef.current) lyricsWindowRef.current.scrollTop = 0
  }, [selectedSong.id])

  const togglePlayback = async () => {
    if (isOriginalMix) {
      if (!audioRef.current) return
      if (audioRef.current.paused) await audioRef.current.play()
      else audioRef.current.pause()
      return
    }
    if (!isPlaying) {
      try {
        await playStemMix(currentTime)
        setMixTime(currentTime)
        setIsPlaying(true)
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Could not play the selected audio tracks.')
      }
    } else {
      stopStemSources()
      setIsPlaying(false)
    }
  }

  const seekBy = (seconds: number) => {
    const time = Math.max(0, Math.min(duration, getMixTime() + seconds))
    seekTo(time)
  }

  const seekTo = (time: number) => {
    if (isOriginalMix) {
      if (audioRef.current) audioRef.current.currentTime = time
    } else {
      const wasPlaying = isPlaying
      stopStemSources(false)
      setMixTime(time)
      setCurrentTime(time)
      if (wasPlaying) void playStemMix(time).catch((error: Error) => setLoadError(error.message))
    }
  }

  const playFromLyric = (time: number) => {
    seekTo(time)
    if (isPlaying) return
    if (isOriginalMix) {
      void audioRef.current?.play().catch(() => setLoadError('Could not play the selected audio track.'))
    } else {
      setMixTime(time)
      void playStemMix(time)
        .then(() => setIsPlaying(true))
        .catch((error: Error) => setLoadError(error.message))
    }
  }

  const toggleStem = (stemId: string) => {
    if (enabledStems.includes(stemId) && enabledStems.length === 1) return
    const time = getMixTime()
    switchingMixRef.current = true
    if (isOriginalMix) audioRef.current?.pause()
    else stopStemSources(false)
    setMixTime(time)
    setCurrentTime(time)
    setEnabledStems((current) => current.includes(stemId) ? current.filter((id) => id !== stemId) : [...current, stemId])
  }

  return (
    <section className="music-container karaoke-page" aria-labelledby="perform-heading">
      <header className="karaoke-heading">
        <div>
          <p className="music-eyebrow">PERFORM</p>
          <h2 id="perform-heading">Karaoke</h2>
          <label className="karaoke-song-picker">
            <span>Choose a song</span>
            <select value={selectedSongId} onChange={(event) => setSelectedSongId(event.target.value)}>
              {karaokeSongs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
            </select>
          </label>
        </div>
        <span className="karaoke-badge">LINE-SYNCED LYRICS</span>
      </header>

      {selectedSong.stems.length > 0 && <fieldset className="karaoke-stems">
        <legend>Backing tracks <span>{isOriginalMix ? 'Original mix' : 'Custom mix'}</span></legend>
        <div className="karaoke-stem-list">
          {selectedSong.stems.map(({ id, label, icon: Icon }) => <label className="karaoke-stem" key={id}>
            <input type="checkbox" checked={enabledStems.includes(id)} onChange={() => toggleStem(id)} />
            <Icon aria-hidden="true" /><span>{label}</span>
          </label>)}
        </div>
        <p>All tracks selected plays the original recording. Turn off vocals to sing with the backing.</p>
      </fieldset>}

      <div className="karaoke-stage" aria-live="off">
        {loadError ? (
          <p className="karaoke-status" role="alert">{loadError}</p>
        ) : lines.length === 0 ? (
          <p className="karaoke-status">Loading timed lyrics…</p>
        ) : (
          <div className="karaoke-lyrics" aria-label="Timed lyrics" ref={lyricsWindowRef}>
            {lines.map((line, index) => (
              <button
                className={`karaoke-line${index === activeIndex ? ' is-active' : ''}${index < activeIndex ? ' is-past' : ''}`}
                key={`${line.time}-${index}`}
                type="button"
                onClick={() => playFromLyric(line.time)}
                ref={index === activeIndex ? activeLineRef : undefined}
                aria-current={index === activeIndex ? 'true' : undefined}
                title={`Seek to ${formatTime(line.time)}`}
              >
                {line.text}
              </button>
            ))}
            <div className="karaoke-lyric-tail" aria-hidden="true" />
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
        src={selectedSong.audio}
        preload="metadata"
        onTimeUpdate={(event) => { if (isOriginalMix) setCurrentTime(event.currentTarget.currentTime) }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onPlay={() => { if (isOriginalMix) setIsPlaying(true) }}
        onPause={() => { if (isOriginalMix && !switchingMixRef.current) setIsPlaying(false) }}
        onEnded={() => setIsPlaying(false)}
        onError={() => setLoadError('Could not load the karaoke MP3.')}
      />
      <p className="karaoke-hint">Tap any lyric line to jump to that point in the song.</p>
    </section>
  )
}

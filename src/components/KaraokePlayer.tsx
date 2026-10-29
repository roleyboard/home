import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioLines, Drum, Guitar, Mic2, Pause, Play, RotateCcw, RotateCw, type LucideIcon } from 'lucide-react'
import './KaraokePlayer.css'

type LyricLine = { time: number; text: string; section?: boolean }
type ChordPhrase = { section: string; lyric: string; chords: string[] }
type ChordEvent = { time: number; chord: string; section: string; id: string }
type StemTrack = { id: string; label: string; src: string; icon: LucideIcon }

const stemTypes = [
  { id: 'vocal', suffix: 'vocal', label: 'Vocals', icon: Mic2 },
  { id: 'backing-vocals', suffix: 'backing_vocals', label: 'Backing Vocals', icon: Mic2 },
  { id: 'drums', suffix: 'drums', label: 'Drums', icon: Drum },
  { id: 'bass', suffix: 'bass', label: 'Bass', icon: Guitar },
  { id: 'guitar', suffix: 'guitar', label: 'Guitar', icon: Guitar },
  { id: 'keyboard', suffix: 'keyboard', label: 'Keyboard (Rhodes EP)', icon: AudioLines },
  { id: 'background', suffix: 'background', label: 'Background', icon: AudioLines },
] as const

function stemCandidatesFor(songTitle: string): StemTrack[] {
  return stemTypes.map(({ id, suffix, label, icon }) => ({
    id,
    label,
    src: `/karaoke/${songTitle}_${suffix}.ogg`,
    icon,
  }))
}

const karaokeSongs = [
  { id: 'baby-can-i-hold-you', title: 'Baby Can I Hold You', audio: '/karaoke/Baby Can I Hold You.mp3', lyrics: '/karaoke/Baby Can I Hold You.lrc', chords: '/karaoke/Baby Can I Hold You.chords', stems: stemCandidatesFor('Baby Can I Hold You') },
  { id: 'on-and-on', title: 'On and On', audio: '/karaoke/On and On.mp3', lyrics: '/karaoke/On and On.lrc', stems: stemCandidatesFor('On and On').map((stem) => stem.id === 'vocal' ? { ...stem, src: '/karaoke/On and On_vocals.mp3' } : stem), chords: '/karaoke/On and On.chords' },
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
    const sectionText = text.match(/^\(([^)]+)\)$/) ?? text.match(/^\[([^\]]+)\]$/)
    const section = Boolean(sectionText && /^(?:intro|verse(?:\s+\d+)?|chorus(?:\s+\d+)?|pre-chorus|post-chorus|bridge|outro|interlude|instrumental|end)$/i.test(sectionText[1].trim()))

    for (const match of matches) {
      const fraction = match[3] ?? '0'
      const milliseconds = Number(fraction.padEnd(3, '0').slice(0, 3))
      lines.push({
        time: Number(match[1]) * 60 + Number(match[2]) + milliseconds / 1000,
        text,
        section,
      })
    }
  }

  return lines.sort((a, b) => a.time - b.time)
}

function isChordToken(token: string) {
  return /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus\d*|add\d*|M|°|ø|\d)*(?:\/[A-G](?:#|b)?)?$/i.test(token)
}

function parseChordChart(source: string): ChordPhrase[] {
  const phrases: ChordPhrase[] = []
  let section = 'Song'
  let pendingChords: string[] = []
  const flush = () => {
    if (pendingChords.length) phrases.push({ section, lyric: '', chords: pendingChords })
    pendingChords = []
  }

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const sectionMatch = line.match(/^\[([^\]]+)\]$/) ?? line.match(/^\(([^)]+)\)$/)
    if (sectionMatch) {
      flush()
      section = sectionMatch[1].trim()
      continue
    }
    if (/^[eBGDAE]\|/i.test(line)) continue
    const tokens = line.split(/\s+/)
    if (tokens.every(isChordToken)) {
      flush()
      pendingChords = tokens
    } else if (pendingChords.length) {
      phrases.push({ section, lyric: line, chords: pendingChords })
      pendingChords = []
    }
  }
  flush()
  return phrases
}

function normalizeWords(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}

function alignChords(phrases: ChordPhrase[], lines: LyricLine[]): ChordEvent[] {
  const lyricLines = lines.filter((line) => !line.section)
  const sectionLines = lines.filter((line) => line.section)
  const matchedIndexes = new Set<number>()
  const phraseTimes = phrases.map((phrase) => {
    if (!phrase.lyric) return null
    const phraseWords = normalizeWords(phrase.lyric)
    let bestIndex = -1
    let bestScore = 0
    lyricLines.forEach((line, index) => {
      if (matchedIndexes.has(index)) return
      const words = new Set(normalizeWords(line.text))
      const score = phraseWords.filter((word) => words.has(word)).length / Math.max(phraseWords.length, words.size)
      if (score > bestScore) { bestScore = score; bestIndex = index }
    })
    if (bestIndex < 0 || bestScore < 0.35) return null
    matchedIndexes.add(bestIndex)
    return lyricLines[bestIndex].time
  })

  phraseTimes.forEach((time, index) => {
    if (time !== null) return
    const previous = phraseTimes.slice(0, index).map((value, phraseIndex) => ({ value, phraseIndex })).reverse().find((entry) => entry.value !== null)
    const next = phraseTimes.slice(index + 1).map((value, offset) => ({ value, phraseIndex: index + offset + 1 })).find((entry) => entry.value !== null)
    if (previous && next) {
      phraseTimes[index] = previous.value! + (next.value! - previous.value!) * (index - previous.phraseIndex) / (next.phraseIndex - previous.phraseIndex)
    } else if (next) {
      phraseTimes[index] = next.value! * index / next.phraseIndex
    } else if (previous) {
      phraseTimes[index] = previous.value! + (index - previous.phraseIndex) * 2
    } else {
      const section = phrases[index].section.toLowerCase()
      const marker = sectionLines.find((line) => normalizeWords(line.text.replace(/[()[\]]/g, '')).join(' ').startsWith(section))
      phraseTimes[index] = marker?.time ?? 0
    }
  })

  const events: ChordEvent[] = []
  phrases.forEach((phrase, index) => {
    const start = phraseTimes[index] ?? 0
    const nextLine = lines.find((line) => line.time > start)
    const end = Math.max(start + 0.4, Math.min(nextLine?.time ?? start + 4, start + 8))
    phrase.chords.forEach((chord, chordIndex) => events.push({
      time: start + (end - start) * chordIndex / Math.max(phrase.chords.length, 1),
      chord,
      section: phrase.section,
      id: `${index}-${chordIndex}`,
    }))
  })
  return events.sort((a, b) => a.time - b.time)
}

function estimateTempo(buffer: AudioBuffer) {
  const frameSize = 1024
  const frameCount = Math.floor(buffer.length / frameSize)
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index))
  const energy = new Float32Array(frameCount)
  let previousRms = 0
  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0
    const start = frame * frameSize
    for (let sample = start; sample < start + frameSize; sample += 1) {
      for (const channel of channels) sum += channel[sample] * channel[sample]
    }
    const rms = Math.sqrt(sum / (frameSize * channels.length))
    energy[frame] = Math.max(0, rms - previousRms)
    previousRms = rms
  }

  const framesPerSecond = buffer.sampleRate / frameSize
  let bestLag = 0
  let bestScore = -Infinity
  for (let bpm = 60; bpm <= 180; bpm += 1) {
    const lag = Math.round(framesPerSecond * 60 / bpm)
    let correlation = 0
    let leftEnergy = 0
    let rightEnergy = 0
    for (let frame = lag; frame < frameCount; frame += 1) {
      const left = energy[frame]
      const right = energy[frame - lag]
      correlation += left * right
      leftEnergy += left * left
      rightEnergy += right * right
    }
    const score = correlation / Math.sqrt(leftEnergy * rightEnergy || 1)
    if (score > bestScore) { bestScore = score; bestLag = lag }
  }
  if (!bestLag) return null

  let bestPhase = 0
  let bestPhaseScore = -Infinity
  for (let phase = 0; phase < bestLag; phase += 1) {
    let score = 0
    for (let frame = phase; frame < frameCount; frame += bestLag) score += energy[frame]
    if (score > bestPhaseScore) { bestPhaseScore = score; bestPhase = phase }
  }
  return {
    bpm: Math.round(framesPerSecond * 60 / bestLag),
    beatOffset: bestPhase / framesPerSecond,
  }
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
  const chordBarRef = useRef<HTMLDivElement>(null)
  const activeChordRef = useRef<HTMLButtonElement>(null)
  const [selectedSongId, setSelectedSongId] = useState(karaokeSongs[0].id)
  const selectedSong = karaokeSongs.find((song) => song.id === selectedSongId) ?? karaokeSongs[0]
  const [lrcText, setLrcText] = useState('')
  const [chordText, setChordText] = useState('')
  const [tempo, setTempo] = useState<{ bpm: number; beatOffset: number } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackFinished, setPlaybackFinished] = useState(false)
  const [availableStems, setAvailableStems] = useState<StemTrack[]>([])
  const [enabledStems, setEnabledStems] = useState<string[]>([])
  const [mixTime, setMixTime] = useState(0)

  const isOriginalMix = enabledStems.length === availableStems.length
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

  const chooseSong = (songId: string) => {
    stopStemSources(false)
    audioRef.current?.pause()
    setIsPlaying(false)
    setSelectedSongId(songId)
  }

  const playStemMix = async (offset: number) => {
    if (!availableStems.length) return
    const context = audioContextRef.current ?? new AudioContext()
    audioContextRef.current = context
    await context.resume()
    const stems = availableStems.filter((stem) => enabledStems.includes(stem.id))
    const buffers = await Promise.all(stems.map(async (stem) => {
      if (stemBuffersRef.current[stem.src]) return stemBuffersRef.current[stem.src]
      const response = await fetch(stem.src)
      if (!response.ok) throw new Error(`Could not load the ${stem.label.toLowerCase()} track.`)
      const buffer = await context.decodeAudioData(await response.arrayBuffer())
      stemBuffersRef.current[stem.src] = buffer
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
        setPlaybackFinished(true)
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
    setAvailableStems([])
    setEnabledStems([])
    setMixTime(0)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setPlaybackFinished(false)
    const controller = new AbortController()
    Promise.all(selectedSong.stems.map(async (stem) => {
      try {
        const response = await fetch(stem.src, { method: 'HEAD', signal: controller.signal })
        const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
        const isSupportedAudio = contentType.includes('audio/ogg') || contentType.includes('application/ogg') || contentType.includes('audio/mpeg')
        return response.ok && isSupportedAudio ? stem : null
      } catch {
        return null
      }
    })).then((results) => {
      if (controller.signal.aborted) return
      const found = results.filter((stem): stem is StemTrack => Boolean(stem))
      setAvailableStems(found)
      setEnabledStems(found.map((stem) => stem.id))
    })
    return () => controller.abort()
  }, [selectedSong.id])

  useEffect(() => {
    switchingMixRef.current = false
    if (isOriginalMix) {
      if (audioRef.current) {
        audioRef.current.currentTime = mixTime
        if (isPlaying) void audioRef.current.play().catch(() => setLoadError('Could not play the selected audio tracks.'))
      }
    } else if (isPlaying && availableStems.length) {
      void playStemMix(mixTime).catch((error: Error) => setLoadError(error.message))
    }
  }, [availableStems, enabledStems, selectedSong.id])

  useEffect(() => {
    const controller = new AbortController()
    setLrcText('')
    setChordText('')
    setLoadError('')
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setPlaybackFinished(false)
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
    if (selectedSong.chords) {
      fetch(selectedSong.chords, { signal: controller.signal })
        .then((response) => response.ok ? response.text() : '')
        .then(setChordText)
        .catch((error: Error) => { if (error.name !== 'AbortError') setChordText('') })
    }
    return () => controller.abort()
  }, [selectedSong.lyrics, selectedSong.chords])

  useEffect(() => {
    const controller = new AbortController()
    setTempo(null)
    fetch(selectedSong.audio, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not analyze audio')
        return response.arrayBuffer()
      })
      .then(async (data) => {
        const context = audioContextRef.current ?? new AudioContext()
        audioContextRef.current = context
        const estimate = estimateTempo(await context.decodeAudioData(data))
        if (!controller.signal.aborted) setTempo(estimate)
      })
      .catch(() => { if (!controller.signal.aborted) setTempo(null) })
    return () => controller.abort()
  }, [selectedSong.audio])

  const lines = useMemo(() => parseLrc(lrcText), [lrcText])
  const chordEvents = useMemo(() => alignChords(parseChordChart(chordText), lines), [chordText, lines])
  const sections = useMemo(() => lines.filter((line) => line.section), [lines])
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
  const activeChordIndex = useMemo(() => {
    if (playbackFinished) return -1
    let low = 0
    let high = chordEvents.length - 1
    let found = -1
    while (low <= high) {
      const middle = Math.floor((low + high) / 2)
      if (chordEvents[middle].time <= currentTime) { found = middle; low = middle + 1 }
      else high = middle - 1
    }
    return found
  }, [chordEvents, currentTime, playbackFinished])
  const beatStepIndex = useMemo(() => {
    if (playbackFinished || !tempo || currentTime < tempo.beatOffset) return -1
    const beatLength = 60 / tempo.bpm
    return Math.floor((currentTime - tempo.beatOffset) / (beatLength / 2)) % 8
  }, [currentTime, playbackFinished, tempo])

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

  useEffect(() => {
    activeChordRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeChordIndex])

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
        setPlaybackFinished(false)
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
    setPlaybackFinished(false)
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
            <select value={selectedSongId} onChange={(event) => chooseSong(event.target.value)}>
              {karaokeSongs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}
            </select>
          </label>
        </div>
        <span className="karaoke-badge">LINE-SYNCED LYRICS</span>
      </header>

      {sections.length > 0 && <nav className="karaoke-sections" aria-label="Jump to song section">
        <span>Sections</span>
        {sections.map((section, index) => <button key={`${section.time}-${index}`} type="button" onClick={() => playFromLyric(section.time)}>
          {section.text.replace(/^[([]|[)\]]$/g, '')}
        </button>)}
      </nav>}

      {availableStems.length > 0 && <fieldset className="karaoke-stems">
        <legend>Backing tracks <span>{isOriginalMix ? 'Original mix' : 'Custom mix'}</span></legend>
        <div className="karaoke-stem-list">
          {availableStems.map(({ id, label, icon: Icon }) => <label className="karaoke-stem" key={id}>
            <input type="checkbox" checked={enabledStems.includes(id)} onChange={() => toggleStem(id)} />
            <Icon aria-hidden="true" /><span>{label}</span>
          </label>)}
        </div>
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

      {chordEvents.length > 0 && <fieldset className="karaoke-chords" aria-label="Chord bar">
        <legend>Chord bar</legend>
        <div className="karaoke-chord-track" ref={chordBarRef}>
          {chordEvents.map((event, index) => <button
            key={event.id}
            type="button"
            className={`karaoke-chord${index === activeChordIndex ? ' is-active' : activeChordIndex >= 0 && Math.abs(index - activeChordIndex) === 1 ? ' is-nearby' : ''}`}
            ref={index === activeChordIndex ? activeChordRef : undefined}
            onClick={() => playFromLyric(event.time)}
            title={`${event.section} · ${formatTime(event.time)}`}
          >{event.chord}</button>)}
        </div>
      </fieldset>}

      {tempo && <fieldset className="karaoke-beats" aria-label={`Beat bar, estimated ${tempo.bpm} beats per minute`}>
        <legend>Beat bar <span>Estimated {tempo.bpm} BPM</span></legend>
        <div className="karaoke-beat-track">
          {['1', '&', '2', '&', '3', '&', '4', '&'].map((beat, index) => <span
            key={`${beat}-${index}`}
            className={`karaoke-beat${index === beatStepIndex ? ` is-active${index % 2 === 1 ? ' is-subbeat' : ''}` : ''}`}
            aria-current={index === beatStepIndex ? 'step' : undefined}
          >{beat}</span>)}
        </div>
      </fieldset>}

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
        onPlay={() => { if (isOriginalMix) { setPlaybackFinished(false); setIsPlaying(true) } }}
        onPause={() => { if (isOriginalMix && !switchingMixRef.current) setIsPlaying(false) }}
        onEnded={() => { setIsPlaying(false); setPlaybackFinished(true) }}
        onError={() => setLoadError('Could not load the karaoke MP3.')}
      />
    </section>
  )
}

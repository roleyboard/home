import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import type { Song } from '../data/songs'

type SongPlayerProps = {
  song: Song
  onEnded: () => void
  onClose: () => void
}

export default function SongPlayer({ song, onEnded, onClose }: SongPlayerProps) {
  const audio = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [lyrics, setLyrics] = useState('')

  useEffect(() => {
    if (!song.lyrics) return

    const controller = new AbortController()
    fetch(song.lyrics, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Lyrics could not be loaded')
        return response.text()
      })
      .then(setLyrics)
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setLyrics('Lyrics could not be loaded.')
      })

    return () => controller.abort()
  }, [song.lyrics])

  useEffect(() => {
    if (!showDetails) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDetails(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [showDetails])

  const togglePlayback = () => {
    if (!audio.current) return
    if (audio.current.paused) audio.current.play()
    else audio.current.pause()
  }

  return (
    <>
      <aside className="now-playing" aria-label={`Now playing: ${song.title}`}>
        <button
          type="button"
          className="now-playing-cover"
          onClick={() => setShowDetails(true)}
          aria-label={`Show artwork and lyrics for ${song.title}`}
        >
          <img src={song.cover} alt="" />
        </button>

        <button type="button" className="now-playing-copy" onClick={() => setShowDetails(true)}>
          <span>Now playing</span>
          <strong>{song.title}</strong>
        </button>

        <button
          type="button"
          className="play-pause"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
        </button>

        <button type="button" className="close-button now-playing-close" onClick={onClose} aria-label="Close player">
          <span aria-hidden="true">&times;</span>
        </button>

        <audio
          ref={audio}
          key={song.id}
          autoPlay
          preload="metadata"
          src={song.audio}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={onEnded}
        />
      </aside>

      {showDetails && (
        <div className="details-backdrop" role="presentation" onMouseDown={() => setShowDetails(false)}>
          <section
            className="song-details"
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="details-close" onClick={() => setShowDetails(false)}>
              <span aria-hidden="true">&times;</span>
              <span className="sr-only">Close artwork and lyrics</span>
            </button>
            <img className="details-cover" src={song.cover} alt={`${song.title} cover`} />
            <div className="details-player" aria-label={`Playback controls for ${song.title}`}>
              <button
                type="button"
                className="play-pause"
                onClick={togglePlayback}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
              </button>
              <div>
                <span className="details-player-label">Now playing</span>
                <strong>{song.title}</strong>
              </div>
            </div>
            <div className="lyrics">
              <h2 id="details-title">{song.title}</h2>
              {song.lyrics ? (
                lyrics ? <Markdown>{lyrics}</Markdown> : <p>Loading lyrics…</p>
              ) : (
                <p>Lyrics coming soon.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

import { useState } from 'react'
import { CircleDot, FileMusic, Guitar, Music2, Palette, Piano } from 'lucide-react'
import './App.css'
import Tabs from './components/Tabs'
import Chart from './components/Chart'
import CoF from './components/CoF'
import Chord from './components/Chord'
import Footer from './components/Footer'
import Modes from './components/Modes'
import Progressions from './components/Progressions'
import SongCard from './components/SongCard'
import SongPlayer from './components/SongPlayer'
import type { Song } from './data/songs'
import { songs } from './data/songs'

export default function App() {
  const [activeTool, setActiveTool] = useState('songs')
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [selectedChord, setSelectedChord] = useState<string | null>(null)
  const [queue, setQueue] = useState<Song[]>(songs)

  const shuffleUpcoming = () => {
    const currentIndex = selectedSong
      ? queue.findIndex((song) => song.id === selectedSong.id)
      : -1
    const played = queue.slice(0, currentIndex + 1)
    const upcoming = queue.slice(currentIndex + 1)

    for (let index = upcoming.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[upcoming[index], upcoming[randomIndex]] = [upcoming[randomIndex], upcoming[index]]
    }

    setQueue([...played, ...upcoming])
  }

  const playNext = () => {
    if (!selectedSong) return
    const currentIndex = queue.findIndex((song) => song.id === selectedSong.id)
    setSelectedSong(queue[currentIndex + 1] ?? null)
  }

  const tools = [
    { tool: 'songs', icon: Music2, label: 'Songs' },
    { tool: 'tabs', icon: FileMusic, label: 'Tabs' },
    { tool: 'chart', icon: Guitar, label: 'Chart' },
    { tool: 'cof', icon: CircleDot, label: 'CoF' },
    { tool: 'modes', icon: Palette, label: 'Modes' },
    { tool: 'progressions', icon: Piano, label: 'Progs' },
  ]

  const renderTool = () => {
    if (activeTool === 'tabs') return <Tabs />
    if (activeTool === 'chart') return <Chart onChordSelect={setSelectedChord} />
    if (activeTool === 'cof') return <CoF onChordSelect={setSelectedChord} />
    if (activeTool === 'modes') return <Modes onChordSelect={setSelectedChord} />
    if (activeTool === 'progressions') return <Progressions onChordSelect={setSelectedChord} />

    return (

    <section className="music-container" aria-labelledby="music-heading">
      <div className="music-heading">
        <div>
          <p className="music-eyebrow">LISTEN</p>
          <h2 id="music-heading">Songs</h2>
        </div>
<button type="button" className="shuffle-button" onClick={shuffleUpcoming}>
            <span aria-hidden="true">&#8644;</span> Shuffle upcoming
          </button>
      </div>



        <div className="song-list">
          {queue.map((song, index) => (
            <SongCard
              key={song.id}
              song={song}
              position={index + 1}
              isPlaying={selectedSong?.id === song.id}
              onSelect={setSelectedSong}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <>


      <main id="top">
        {renderTool()}
        {selectedChord && (
          <aside className="selected-chord" aria-label={`Selected chord: ${selectedChord}`}>
            <button
              type="button"
              className="close-button selected-chord-close"
              onClick={() => setSelectedChord(null)}
              aria-label="Close chord display"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <Chord chord={selectedChord} />
          </aside>
        )}
      </main>

      <Footer />

      <nav className="fixed-tab-bar" aria-label="Musaic tools">
        {tools.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            className={`fixed-tab ${activeTool === tool ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActiveTool(tool)}
          >
            <Icon className="fixed-tab-icon" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {selectedSong && activeTool === 'songs' && (
        <SongPlayer
          key={selectedSong.id}
          song={selectedSong}
          onEnded={playNext}
          onClose={() => setSelectedSong(null)}
        />
      )}
    </>
  )
}

import { useEffect, useState } from 'react'
import { BookOpen, CircleDot, Drum, Guitar, Headphones, LayoutGrid, List, Mic2, Piano, Shuffle, Sparkles } from 'lucide-react'
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

const sectionOrder = ['listen', 'learn', 'play', 'sing', 'perform'] as const
const learnTabOrder = ['chords', 'circle-of-fifths', 'modes', 'progressions'] as const

type SectionId = (typeof sectionOrder)[number]
type LearnTabId = (typeof learnTabOrder)[number]

const resolveInitialSection = (): SectionId => {
  if (typeof window === 'undefined') return 'listen'

  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const match = path.split('/').filter(Boolean)[0]

  return sectionOrder.includes(match as SectionId) ? (match as SectionId) : 'listen'
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>(resolveInitialSection)
  const [activeLearnTab, setActiveLearnTab] = useState<LearnTabId>('chords')
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [selectedChord, setSelectedChord] = useState<string | null>(null)
  const [queue, setQueue] = useState<Song[]>(songs)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    const syncFromHistory = () => {
      const nextSection = resolveInitialSection()
      setActiveSection(nextSection)
    }

    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [])

  useEffect(() => {
    const nextPath = `/${activeSection}`
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ section: activeSection }, '', nextPath)
    }
  }, [activeSection])

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

  const mainSections = [
    { id: 'listen', icon: Headphones, label: 'Listen' },
    { id: 'learn', icon: BookOpen, label: 'Learn' },
    { id: 'play', icon: Guitar, label: 'Play' },
    { id: 'sing', icon: Mic2, label: 'Sing' },
    { id: 'perform', icon: Drum, label: 'Perform' },
  ] as const

  const learnTabs = [
    { id: 'chords', label: 'Chords', icon: Guitar },
    { id: 'circle-of-fifths', label: 'Circle of Fifths', icon: CircleDot },
    { id: 'modes', label: 'Modes', icon: Sparkles },
    { id: 'progressions', label: 'Progressions', icon: Piano },
  ] as const

  const renderLearnPanel = () => {
    if (activeLearnTab === 'circle-of-fifths') return <CoF onChordSelect={setSelectedChord} />
    if (activeLearnTab === 'modes') return <Modes onChordSelect={setSelectedChord} />
    if (activeLearnTab === 'progressions') return <Progressions onChordSelect={setSelectedChord} />

    return <Chart onChordSelect={setSelectedChord} />
  }

  const renderSectionContent = () => {
    if (activeSection === 'learn') {
      return (
        <section className="music-container" aria-labelledby="learn-heading">
          <div className="music-heading">
            <div>
              <p className="music-eyebrow">LEARN</p>
              <h2 id="learn-heading">Music theory</h2>
            </div>
          </div>

          <nav className="learn-subnav" aria-label="Learn topics">
            {learnTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`learn-tab ${activeLearnTab === id ? 'is-active' : ''}`}
                onClick={() => setActiveLearnTab(id)}
                aria-pressed={activeLearnTab === id}
              >
                <Icon className="learn-tab-icon" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="learn-panel">{renderLearnPanel()}</div>
        </section>
      )
    }

    if (activeSection === 'play') {
      return <Tabs onChordSelect={setSelectedChord} />
    }

    if (activeSection === 'sing') {
      return (
        <section className="music-container placeholder-section" aria-labelledby="sing-heading">
          <div className="placeholder-card">
            <p className="music-eyebrow">SING</p>
            <h2 id="sing-heading">MUSUK Sing</h2>
            <p>Pitch, tuning and vocal training coming soon.</p>
          </div>
        </section>
      )
    }

    if (activeSection === 'perform') {
      return (
        <section className="music-container placeholder-section" aria-labelledby="perform-heading">
          <div className="placeholder-card">
            <p className="music-eyebrow">PERFORM</p>
            <h2 id="perform-heading">MUSUK Perform</h2>
            <div className="placeholder-grid">
              <button type="button" className="placeholder-tile">
                <span className="placeholder-tile-label">DrummerBoy</span>
              </button>
              <button type="button" className="placeholder-tile">
                <span className="placeholder-tile-label">Backing Band</span>
              </button>
            </div>
          </div>
        </section>
      )
    }

    return (
      <section className="music-container" aria-labelledby="music-heading">
        <div className="music-heading">
          <div>
            <p className="music-eyebrow">LISTEN</p>
            <h2 id="music-heading">MUSUK Songs</h2>
          </div>

          <button
            type="button"
            className={`list-view${viewMode === 'list' ? ' is-active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            title="List view"
          >
            <List aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`icon-view${viewMode === 'grid' ? ' is-active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Icon view"
            aria-pressed={viewMode === 'grid'}
            title="Icon view"
          >
            <LayoutGrid aria-hidden="true" />
          </button>

          <button type="button" className="shuffle-button" onClick={shuffleUpcoming} aria-label="Shuffle upcoming songs" title="Shuffle upcoming songs">
            <Shuffle aria-hidden="true" />
          </button>
        </div>

        <div className={`song-list${viewMode === 'grid' ? ' icon-song-grid' : ''}`}>
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
      <main id="top">{renderSectionContent()}</main>

      {selectedChord && (
        <aside className="selected-chord" aria-label={`Selected chord: ${selectedChord}`}>
          <Chord chord={selectedChord} onClose={() => setSelectedChord(null)} />
        </aside>
      )}

      <Footer />

      <nav className="fixed-tab-bar" aria-label="MUSUK sections">
        {mainSections.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`fixed-tab ${activeSection === id ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActiveSection(id)}
          >
            <Icon className="fixed-tab-icon" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {selectedSong && activeSection === 'listen' && (
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

import { useState } from 'react'
import './App.css'
import Footer from './components/Footer'
import Header from './components/Header'
import SongCard from './components/SongCard'
import SongPlayer from './components/SongPlayer'
import type { Song } from './data/songs'
import { songs } from './data/songs'

export default function App() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
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

  return (
    <>
      <Header />

      <main id="top">
        <section className="music" aria-labelledby="music-heading">
          <div className="section-heading">
            <h2 id="music-heading">Listen</h2>
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
      </main>

      <Footer />

      {selectedSong && (
        <SongPlayer key={selectedSong.id} song={selectedSong} onEnded={playNext} />
      )}
    </>
  )
}

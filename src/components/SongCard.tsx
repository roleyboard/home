import type { Song } from "../data/songs";

type SongCardProps = {
  song: Song;
  position: number;
  isPlaying: boolean;
  onSelect: (song: Song) => void;
};

export default function SongCard({ song, position, isPlaying, onSelect }: SongCardProps) {
  return (
    <article className={`song-card${isPlaying ? ' is-playing' : ''}`}>
      <button type="button" className="song-select" onClick={() => onSelect(song)}>
        <span className="queue-position">{isPlaying ? '♪' : position}</span>
        <img className="song-cover" src={song.cover} alt="" />
        <span className="song-copy">
          <span className="song-title">{song.title}</span>
          <span className="song-subtitle">{isPlaying ? 'NOW PLAYING' : 'Tap to play'}</span>
        </span>
        <span className="row-play" aria-hidden="true">&#9654;</span>
      </button>
    </article>
  );
}

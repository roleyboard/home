export type Song = {
  id: number;
  title: string;
  cover: string;
  audio: string;
    year?: number
  lyrics?: string
};

type SongGridProps = {
  songs: Song[];
};

export default function SongGrid({ songs }: SongGridProps) {
  return (
    <section className="song-grid">
      {songs.map((song) => (
        <article className="song-card" key={song.id}>
          <img src={song.cover} alt={`${song.title} cover`} />
          <h2>{song.title}</h2>

          <audio controls preload="metadata" src={song.audio} />
        </article>
      ))}
    </section>
  );
}
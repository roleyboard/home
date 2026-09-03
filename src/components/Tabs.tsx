import React, { useEffect, useState } from 'react';

import "./Tabs.css";

interface TabsProps {
  onChordSelect: (chord: string) => void;
}

interface Song {
  id: string | number;
  name: string;
  composer?: string;
  lyrics?: string;
}

const chordRegex =
  /^[A-G][#b]?(?:maj|min|m|dim|aug|sus|add)?\d*(?:sus\d*)?(?:\/[A-G][#b]?)?$/;

const Tabs: React.FC<TabsProps> = ({ onChordSelect }) => {

  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editComposer, setEditComposer] = useState('');
  const [editLyrics, setEditLyrics] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2500);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [showBpmTags, setShowBpmTags] = useState(false);
  const selectedSongData = songs.find(s => String(s.id) === selectedSong);
  const bpmMatch = editLyrics.match(/<bpm=(\d+)>/i);
  const bpm = bpmMatch ? bpmMatch[1] : null;

  // Support multiple media URLs with optional labels
  const mediaMatches = [...editLyrics.matchAll(/<media=(.*?)>/gi)];
  const mediaItems = mediaMatches.map((m, index) => {
    const raw = m[1];
    // support "url, label" format
    if (raw.includes(',')) {
      const [url, label] = raw.split(',').map(s => s.trim());
      return { url, label };
    }
    // fallback: no label
    return { url: raw.trim(), label: `🎵 ${index + 1}` };
  });

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const bpmScrollSpeed = bpm
    ? ((60 / Number(bpm)) * 4) * 1000
    : 2500;

  const baseUrl = 'https://4b716912-a31b-4b94-a585-478494e0481e.eu-central-1.cloud.genez.io/songs';

  useEffect(() => {
    fetch(baseUrl)
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error('Error fetching songs:', err));
  }, []);

  useEffect(() => {
    if (selectedSongData) {
      setEditName(selectedSongData.name || '');
      setEditComposer(selectedSongData.composer || '');
      setEditLyrics(
        selectedSongData.lyrics ||
        (selectedSongData as any).lyrics_chords_tab ||
        ''
      );
      // 🔥 reset playback + BPM UI when switching songs
      setCurrentBpm(null);
      setShowBpmTags(false);
      setSelectedLine(null);
      setIsPlaying(false);
      setScrollSpeed(2500);
      // Reset active media index when song changes
      setActiveMediaIndex(0);
    }
  }, [selectedSongData]);

  useEffect(() => {
    if (!isPlaying) return;

    const lyricLines = editLyrics.split('\n');

    let currentIndex = selectedLine ?? -1;

    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;

      while (nextIndex < lyricLines.length) {
        const line = lyricLines[nextIndex];
        const tokens = line.match(/<[^>]+>|\[[^\]]+\]|[^\s]+|\s+/g) || [];

        const selectable = tokens.some(token => {
          const clean = token.trim();

          if (!clean) return false;
          if (clean.startsWith('<') && clean.endsWith('>')) return false;
          if ((clean.startsWith('(') && clean.endsWith(')')) || (clean.startsWith('[') && clean.endsWith(']')))
            return false;
          if (chordRegex.test(clean)) return false;

          return true;
        });

        if (selectable) {
          currentIndex = nextIndex;

          // 🔥 detect BPM tag in current or previous lines
          const bpmRegex = /<bpm=(\d+)>/i;
          let detectedBpm: number | null = null;

          // check current line first
          const currentLine = lyricLines[nextIndex];
          const currentMatch = currentLine.match(bpmRegex);

          if (currentMatch) {
            detectedBpm = Number(currentMatch[1]);
          } else {
            // walk backwards to find last bpm tag
            for (let i = nextIndex - 1; i >= 0; i--) {
              const match = lyricLines[i].match(bpmRegex);
              if (match) {
                detectedBpm = Number(match[1]);
                break;
              }
            }
          }

          // apply BPM-based scroll speed if found
          if (detectedBpm) {
            const newSpeed = ((60 / detectedBpm) * 4) * 1000;
            setScrollSpeed(newSpeed);
            setCurrentBpm(detectedBpm);
          }

          setSelectedLine(nextIndex);

          const el = document.getElementById(`song-line-${nextIndex}`);
          el?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          return;
        }

        nextIndex++;
      }

      setIsPlaying(false);
    }, scrollSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, editLyrics, scrollSpeed, selectedLine]);

  const renderLyrics = (text: string) => {
    return text.split('\n').map((line, lineIndex) => {
      const tokens = line.match(/<[^>]+>|\[[^\]]+\]|[^\s]+|\s+/g) || [];

      const selectableLine = tokens.some(token => {
        const clean = token.trim();

        if (!clean) return false;

        // ignore meta tags
        if (clean.startsWith('<') && clean.endsWith('>')) return false;

        // ignore section tags
        if ((clean.startsWith('(') && clean.endsWith(')')) || (clean.startsWith('[') && clean.endsWith(']'))) return false;

        // ignore chord-only tokens
        if (chordRegex.test(clean)) return false;

        // any remaining text counts as selectable lyric content
        return true;
      });

      return (
        <div
          id={`song-line-${lineIndex}`}
          className={`song-para ${selectedLine === lineIndex ? 'selected-line' : ''}`}
          key={lineIndex}
          onClick={() => {
            if (selectableLine) {
              setSelectedLine(lineIndex);

              // 🔥 detect BPM for clicked line
              const lyricLines = text.split('\n');
              const bpmRegex = /<bpm=(\d+)>/i;
              let detectedBpm: number | null = null;

              // check current line first
              const currentMatch = lyricLines[lineIndex].match(bpmRegex);

              if (currentMatch) {
                detectedBpm = Number(currentMatch[1]);
              } else {
                // walk backwards to find last bpm tag
                for (let i = lineIndex - 1; i >= 0; i--) {
                  const match = lyricLines[i].match(bpmRegex);
                  if (match) {
                    detectedBpm = Number(match[1]);
                    break;
                  }
                }
              }

              // apply BPM immediately
              if (detectedBpm) {
                const newSpeed = ((60 / detectedBpm) * 4) * 1000;
                setScrollSpeed(newSpeed);
                setCurrentBpm(detectedBpm);
              }

              // if auto-scroll is active, restart from this line
              if (isPlaying) {
                setIsPlaying(false);

                setTimeout(() => {
                  setIsPlaying(true);
                }, 50);
              }
            }
          }}
        >
          {selectedLine === lineIndex && isPlaying && (
            <div
              className="line-progress"
              style={{ animationDuration: `${scrollSpeed}ms` }}
            />
          )}

          {tokens.map((part, i) => {

            // angled bracket tags
            if (part.startsWith('<') && part.endsWith('>')) {
              const metaContent = part.slice(1, -1);
              const [label, ...valueParts] = metaContent.split('=');
              const value = valueParts.join(':');

              // hide BPM and MEDIA tags if toggled off
              if ((label.toLowerCase() === 'bpm' || label.toLowerCase() === 'media') && !showBpmTags) {
                return null;
              }

              return (
                <div key={i} className="meta-tag">
                  <span className="meta-label">{label}</span>
                  {value && (
                    <span className="meta-value">{value}</span>
                  )}
                </div>
              );
            }

            // square bracket tags
            if ((part.startsWith('(') && part.endsWith(')')) ||

              (part.startsWith('[') && part.endsWith(']'))) {
              return (
                <div key={i} className="bracket-tag">
                  {part.slice(1, -1)}
                </div>
              );
            }

            // chords
            if (chordRegex.test(part.trim())) {
              return (
                <button
                  key={i}
                  className="chord-tag"
                  onClick={() => onChordSelect?.(part.trim())}
                >
                  {part.trim()}
                </button>
              );
            }

            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="tabs-container">

      <div className="edit-mode">

        <div className="tool-title">📝 Tabs <span className='song-total'>({songs.length} Song{songs.length > 1 ? 's' : ''})</span></div>

        {selectedSongData && (
          <div>
            <span><b>Edit Mode:</b></span>
            <label className="switch">
              <input
                type="checkbox"
                checked={editMode}
                onChange={() => setEditMode(prev => !prev)}
              />
              <span className="slider" />
            </label>
          </div>
        )}

      </div>

      {selectedSong && !editMode && (
        <div className="play-controls">
          <button
            className={`play-button ${isPlaying ? 'stop-mode' : 'start-mode'}`}
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                // resume from current selected line if available
                // otherwise start from beginning
                setIsPlaying(true);
              }
            }}
          >
            {isPlaying ? '⏹ Stop Scroll' : '▶️ Auto Scroll'}
          </button>


          {!bpm && !currentBpm && (
            <>
              <button
                className={`speed-button ${scrollSpeed === 4000 ? 'active-speed' : ''}`}
                onClick={() => {
                  setScrollSpeed(4000);
                }}
              >
                SLOW
                🐢
              </button>

              <button
                className={`speed-button ${scrollSpeed === 2500 ? 'active-speed' : ''}`}
                onClick={() => {
                  setScrollSpeed(2500);
                }}
              >
                FAST
                🐇
              </button>
            </>
          )}
          {(bpm || currentBpm) && (
            <>
              <button
                className={`speed-button ${currentBpm ? 'active-speed' : ''}`}
                onClick={() => {
                  if (currentBpm) {
                    const newSpeed = ((60 / currentBpm) * 4) * 1000;
                    setScrollSpeed(newSpeed);
                  } else if (bpm) {
                    setScrollSpeed(bpmScrollSpeed);
                  }
                }}
              >
                🥁 {currentBpm || bpm} BPM
              </button>

              <button
                className='speed-button'
                onClick={() => setShowBpmTags(prev => !prev)}
              >
                {showBpmTags ? 'Hide BPM' : 'Show BPM'}
              </button>
            </>

          )}

        </div>
      )}

      {selectedSong && !editMode && mediaItems.length > 0 && (
        <div className='media-option'>
          {mediaItems.length > 1 && (
            <div className="media-switch">
              {mediaItems.map((item, i) => (
                <button
                  key={i}
                  className={i === activeMediaIndex ? 'media-btn active' : 'media-btn'}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveMediaIndex(i);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          <audio
            key={activeMediaIndex}
            controls
            style={{ width: '95%' }}
            onPlay={() => {
              if (!isPlaying) setIsPlaying(true);
            }}
            onPause={() => {
              if (isPlaying) setIsPlaying(false);
            }}
          >
            <source src={mediaItems[activeMediaIndex]?.url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <select
        className="song-select"
        value={selectedSong}
        onChange={(e) => setSelectedSong(e.target.value)}
      >
        <option value="">Select a song</option>
        {[...songs]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((song) => (
            <option key={song.id} value={String(song.id)}>
              {song.name}{song.composer ? ` - ${song.composer}` : ''}
            </option>
          ))}
      </select>

      <div className="song-display">
        {editMode ? (
          <>
            <div>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Song Name"
              />
            </div>
            <div>
              <input
                value={editComposer}
                onChange={(e) => setEditComposer(e.target.value)}
                placeholder="Composer"
              />
            </div>
            <div>
              <textarea
                value={editLyrics}
                onChange={(e) => setEditLyrics(e.target.value)}
                rows={12}
                placeholder="Lyrics / Chords"
              />
            </div>

            <button className='editbuts'
              disabled={saving}
              onClick={() => {
                setSaving(true);
                if (!selectedSongData) return;
                const updatedSong = {
                  ...selectedSongData,
                  name: editName,
                  composer: editComposer,
                  lyrics: editLyrics,
                };
                fetch(`${baseUrl}/${selectedSongData.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedSong),
                })
                  .then(res => res.json())
                  .then((updated) => {
                    setSongs(prev =>
                      prev.map(s =>
                        String(s.id) === String(updated.id) ? updated : s
                      )
                    );
                    setSaved(true);
                    setTimeout(() => setSaved(false), 5000);
                    setSaving(false);
                  })
                  .catch(err => {
                    console.error('Error updating song:', err);
                    setSaving(false);
                  });
              }}
            >
              {saving ? <span style={{ color: 'red' }}>💿 Saving...</span> : '💾 Save Tab'}
            </button>

            <button className='editbuts'
              onClick={() => {
                if (!selectedSongData) return;

                if (!window.confirm('Delete this song?')) return;

                fetch(`${baseUrl}/${selectedSongData.id}`, {
                  method: 'DELETE',
                })
                  .then(() => {
                    setSongs(prev =>
                      prev.filter(s => String(s.id) !== String(selectedSongData.id))
                    );
                    setSelectedSong('');
                    setEditName('');
                    setEditComposer('');
                    setEditLyrics('');
                  })
                  .catch(err => console.error('Error deleting song:', err));
              }}
            >
              🗑️ Delete Tab
            </button>

          </>
        ) : (
          <>

            <div className='song-title'>{editName}</div>
            <div className='song-composer'>{editComposer}</div>
            <div className="song-lyrics">
              {renderLyrics(editLyrics)}
            </div>

          </>
        )}

        <button className='editbuts'
          onClick={() => {
            const newSong = {
              name: 'New Song',
              composer: '',
              lyrics: ''
            };
            fetch(baseUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newSong),
            })
              .then(res => res.json())
              .then((added) => {
                setSongs(prev => [...prev, added]);
                setSelectedSong(String(added.id));
              })
              .catch(err => console.error('Error creating song:', err));
          }}
        >
          ➕ New Tab
        </button>

      </div>
      {saved && <div className="saved-message">Saved</div>}
    </div>
  );
};

export default Tabs;

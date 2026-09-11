import React, { useEffect, useState } from 'react';
import './Chord.css';
import InNav from './In-Nav.tsx';
import InPiano from './In-Piano.tsx';
import InGuitar from './In-Guitar.tsx';
import InStave from './In-Stave.tsx';
import Inversion from './Inversion.tsx';

interface ChordProps {
  chord: string;
  onClose: () => void;
}

type ChordType =
  | 'major' | 'minor' | '7' | 'dim' | 'dim7' | '°' | 'ø' | '+' | 'aug'
  | 'sus' | 'sus2' | 'sus4' | 'sus2sus4' | '7sus4'
  | 'add9' | 'add11'
  | '6' | '69'
  | '9' | '9b5' | '11' | '13'
  | 'M7' | 'Maj7' | 'maj7' | 'maj7b5' | 'maj7#5' | 'maj7sus2' | 'maj9' | 'maj11' | 'maj13'
  | 'm6' | 'm69' | 'm7' | 'm7b5' | 'm9' | 'm11' | 'm13'
  | 'mmaj7' | 'mmaj7b5' | 'mmaj9' | 'mmaj11'
  | '7b5' | '7b9' | '7#9' | 'aug7' | 'alt' | '5';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FLAT_TO_SHARP: Record<string, string> = {
  Ab: 'G#', Bb: 'A#', Db: 'C#', Eb: 'D#', Gb: 'F#',
};

const parseChord = (chord: string): { root: string; type: ChordType } => {
  const match = chord.match(/^([A-G]#?|[A-G]b?)(maj13|maj11|maj9|maj7b5|maj7#5|maj7sus2|M7|maj7|Maj7|mmaj11|mmaj9|mmaj7b5|mmaj7|m13|m11|m9|m7b5|m7|m69|m6|m|13|11|9b5|9|add11|add9|7#9|aug7|7b9|7b5|7sus4|7|sus2sus4|sus4|sus2|sus|dim7|dim|aug|5|6|69|alt|\+|°|ø)?$/i);
  if (!match) return { root: 'C', type: 'major' };
  let [, root, suffix] = match;
  root = FLAT_TO_SHARP[root] || root;
  switch (suffix) {

    case 'Maj7': return { root, type: 'Maj7' };


    case 'M7': return { root, type: 'Maj7' };



    case 'maj13': return { root, type: 'maj13' };
    case 'maj11': return { root, type: 'maj11' };
    case 'maj9': return { root, type: 'maj9' };
    case 'maj7b5': return { root, type: 'maj7b5' };
    case 'maj7#5': return { root, type: 'maj7#5' };
    case 'maj7sus2': return { root, type: 'maj7sus2' };
    case 'maj7': return { root, type: 'maj7' };
    case 'mmaj11': return { root, type: 'mmaj11' };
    case 'mmaj9': return { root, type: 'mmaj9' };
    case 'mmaj7b5': return { root, type: 'mmaj7b5' };
    case 'mmaj7': return { root, type: 'mmaj7' };
    case 'm13': return { root, type: 'm13' };
    case 'm11': return { root, type: 'm11' };
    case 'm9': return { root, type: 'm9' };
    case 'm7b5': return { root, type: 'm7b5' };
    case 'm7': return { root, type: 'm7' };
    case 'm69': return { root, type: 'm69' };
    case 'm6': return { root, type: 'm6' };
    case 'm': return { root, type: 'minor' };
    case '13': return { root, type: '13' };
    case '11': return { root, type: '11' };
    case '9b5': return { root, type: '9b5' };
    case '9': return { root, type: '9' };
    case 'add11': return { root, type: 'add11' };
    case 'add9': return { root, type: 'add9' };
    case '7#9': return { root, type: '7#9' };
    case 'aug7': return { root, type: 'aug7' };
    case '7b9': return { root, type: '7b9' };
    case '7b5': return { root, type: '7b5' };
    case '7sus4': return { root, type: '7sus4' };
    case '7': return { root, type: '7' };
    case 'sus2sus4': return { root, type: 'sus2sus4' };
    case 'sus4': return { root, type: 'sus4' };
    case 'sus2': return { root, type: 'sus2' };
    case 'sus': return { root, type: 'sus' };
    case 'dim7': return { root, type: 'dim7' };
    case 'dim': return { root, type: 'dim' };
    case 'aug': return { root, type: 'aug' };
    case '5': return { root, type: '5' };
    case '6': return { root, type: '6' };
    case '69': return { root, type: '69' };
    case 'alt': return { root, type: 'alt' };
    case '+': return { root, type: '+' };
    case '°': return { root, type: '°' };
    case 'ø': return { root, type: 'ø' };
    default: return { root, type: 'major' };
  }
};


const chordToNotes = (root: string, type: ChordType): string[] => {
  const rootIndex = NOTES.indexOf(root.toUpperCase());
  if (rootIndex === -1) return [];
  const intervals =
    type === 'major' ? [0, 4, 7]
      : type === 'minor' ? [0, 3, 7]
        : type === '7' ? [0, 4, 7, 10]
          : type === 'dim' || type === '°' ? [0, 3, 6]
            : type === 'dim7' ? [0, 3, 6, 9]
              : type === 'aug' || type === '+' ? [0, 4, 8]
                : type === 'sus' ? [0, 5, 7]
                  : type === 'sus2' ? [0, 2, 7]
                    : type === 'sus4' ? [0, 5, 7]
                      : type === 'sus2sus4' ? [0, 2, 5, 7]
                        : type === '7sus4' ? [0, 5, 7, 10]
                          : type === 'add9' ? [0, 4, 7, 14]
                            : type === 'add11' ? [0, 4, 7, 17]
                              : type === '6' ? [0, 4, 7, 9]
                                : type === '69' ? [0, 4, 7, 9, 14]
                                  : type === '5' ? [0, 7]
                                    : type === '9' ? [0, 4, 7, 10, 14]
                                      : type === '9b5' ? [0, 4, 6, 10, 14]
                                        : type === '11' ? [0, 4, 7, 10, 14, 17]
                                          : type === '13' ? [0, 4, 7, 10, 14, 21]
                                            : type === 'maj7' || type === 'Maj7' || type === 'M7' ? [0, 4, 7, 11]
                                              : type === 'maj7b5' ? [0, 4, 6, 11]
                                                : type === 'maj7#5' ? [0, 4, 8, 11]
                                                  : type === 'maj7sus2' ? [0, 2, 7, 11]
                                                    : type === 'maj9' ? [0, 4, 7, 11, 14]
                                                      : type === 'maj11' ? [0, 4, 7, 11, 14, 17]
                                                        : type === 'maj13' ? [0, 4, 7, 11, 14, 21]
                                                          : type === 'm6' ? [0, 3, 7, 9]
                                                            : type === 'm69' ? [0, 3, 7, 9, 14]
                                                              : type === 'm7' ? [0, 3, 7, 10]
                                                                : type === 'm7b5' || type === 'ø' ? [0, 3, 6, 10]
                                                                  : type === 'm9' ? [0, 3, 7, 10, 14]
                                                                    : type === 'm11' ? [0, 3, 7, 10, 14, 17]
                                                                      : type === 'm13' ? [0, 3, 7, 10, 14, 21]
                                                                        : type === 'mmaj7' ? [0, 3, 7, 11]
                                                                          : type === 'mmaj7b5' ? [0, 3, 6, 11]
                                                                            : type === 'mmaj9' ? [0, 3, 7, 11, 14]
                                                                              : type === 'mmaj11' ? [0, 3, 7, 11, 14, 17]
                                                                                : type === '7b5' ? [0, 4, 6, 10]
                                                                                  : type === '7b9' ? [0, 4, 7, 10, 13]
                                                                                    : type === '7#9' ? [0, 4, 7, 10, 15]
                                                                                      : type === 'aug7' ? [0, 4, 8, 10]
                                                                                        : [0, 4, 7]; // default
  return intervals.map(i => NOTES[(rootIndex + i) % 12]);
};

const Chord: React.FC<ChordProps> = ({ chord, onClose }) => {
  const [coreNotes, setCoreNotes] = useState<string[]>([]);
  const [invertedNotes, setInvertedNotes] = useState<string[]>([]);
  const [inversion, setInversion] = useState(0);

  const [showStave, setShowStave] = useState(false);
  const [showPiano, setShowPiano] = useState(false);
  const [showGuitar, setShowGuitar] = useState(true);

  useEffect(() => {
    // 🔥 handle slash chords (e.g. Dm/F)
    const [mainChord, bassNoteRaw] = chord.split('/');

    const parsed = parseChord(mainChord);
    const notes = chordToNotes(parsed.root, parsed.type);

    // normalize bass note (handle flats)
    const bassNote = bassNoteRaw
      ? (FLAT_TO_SHARP[bassNoteRaw] || bassNoteRaw)
      : null;

    const adjustedNotes = notes.reduce<string[]>((acc, note, idx) => {
      let octave = 4;
      if (idx > 0) {
        const prevNote = acc[idx - 1].slice(0, -1);
        const prevOct = parseInt(acc[idx - 1].slice(-1));
        const prevIndex = NOTES.indexOf(prevNote);
        const currIndex = NOTES.indexOf(note);
        octave = currIndex <= prevIndex ? prevOct + 1 : prevOct;
      }
      acc.push(`${note}${octave}`);
      return acc;
    }, []);

    // 🔥 prepend bass note for slash chords (lower octave)
    let finalNotes = adjustedNotes;

    if (bassNote) {
      finalNotes = [`${bassNote}3`, ...adjustedNotes];
    }

    setCoreNotes(finalNotes);
    setInversion(0);
    setInvertedNotes(finalNotes);
  }, [chord]);


  useEffect(() => {
    if (coreNotes.length === 0) return;
    const rotated = [...coreNotes.slice(inversion), ...coreNotes.slice(0, inversion)];
    const octaveAdjusted = rotated.map((note, i) => {
      const base = note.slice(0, -1);
      let octave = parseInt(note.slice(-1));
      return i < coreNotes.length - inversion
        ? `${base}${octave}`
        : `${base}${octave + 1}`;
    });

    setInvertedNotes(octaveAdjusted);
  }, [inversion, coreNotes]);


  return (
    <div className="chord-container">
      <InNav
        onToggleStave={() => { setShowStave(true); setShowPiano(false); setShowGuitar(false); }}
        onTogglePiano={() => { setShowPiano(true); setShowStave(false); setShowGuitar(false); }}
        onToggleGuitar={() => { setShowGuitar(true); setShowStave(false); setShowPiano(false); }}
        onClose={onClose}
        showStave={showStave}
        showPiano={showPiano}
        showGuitar={showGuitar}
      />

      <div className="chord-details">
        <div className="chord-info">
          {chord}
          {coreNotes.length > 0 && (
            <span className="chord-notes"> ({coreNotes.join(' ')})</span>
          )}
        </div>

        {(showPiano || showStave) && (
          <Inversion
            coreNotes={coreNotes}
            invertedNotes={invertedNotes}
            inversion={inversion}
            setInversion={setInversion}
          />
        )}
      </div>

      {showPiano && !showGuitar && !showStave && (<>
        <InPiano activeNotes={invertedNotes} />
      </>
      )}

      {showGuitar && !showPiano && !showStave &&
        <InGuitar guitarChordName={chord} />}

      {showStave && !showPiano && !showGuitar && (<>
        <InStave activeNotes={invertedNotes} />
      </>
      )}

    </div>
  );
};

export default Chord;
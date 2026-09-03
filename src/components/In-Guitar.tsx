import React, { useState } from "react";
import Chord from "@tombatossals/react-chords/lib/Chord";
import './In-Guitar.css';
import guitarChords from './guitar.json';

interface InGuitarProps {
  guitarChordName: string; // e.g., 'Am'
}

interface ChordsObject {
  [key: string]: any[];
}



const chordShapes: Record<string, any> = {};

Object.entries(guitarChords.chords).forEach(([key, chordArray]: [string, any[]]) => {
  chordArray.forEach((chord) => {
    const suffix = chord.suffix;
    const suffixMap: Record<string, string> = {
      major: '',
      minor: 'm',
      dim: 'dim',
      dim7: 'dim7',
      sus: 'sus',
      sus2: 'sus2',
      sus4: 'sus4',
      sus2sus4: 'sus2sus4',
      '7sus4': '7sus4',
      '7/G': '7/G',
      alt: 'alt',
      aug: 'aug',
      '5': '5',
      '6': '6',
      '69': '69',
      '7': '7',
      '7b5': '7b5',
      aug7: 'aug7',
      '9': '9',
      '9b5': '9b5',
      aug9: 'aug9',
      '7b9': '7b9',
      '7#9': '7#9',
      '11': '11',
      '9#11': '9#11',
      '13': '13',
      maj7: 'maj7',
      maj7b5: 'maj7b5',
      'maj7#5': 'maj7#5',
      maj7sus2: 'maj7sus2',
      maj9: 'maj9',
      maj11: 'maj11',
      maj13: 'maj13',
      m6: 'm6',
      m69: 'm69',
      m7: 'm7',
      m7b5: 'm7b5',
      m9: 'm9',
      m11: 'm11',
      mmaj7: 'mmaj7',
      mmaj7b5: 'mmaj7b5',
      mmaj9: 'mmaj9',
      mmaj11: 'mmaj11',
      add9: 'add9',
      madd9: 'madd9',
      add11: 'add11',
      M7: 'maj7',
    };

    const normalized = suffixMap[suffix] ?? suffix;
    const chordName = `${key}${normalized}`;
    const position = chord.positions[0];

    chordShapes[chordName] = {
      frets: position.frets,
      fingers: position.fingers,
      barres: position.barres,
      capo: position.capo || false,
      baseFret: position.baseFret,
    };
  });
});

const instrument = {
  strings: 6,
  fretsOnChord: 4,
  name: "Guitar",
  keys: [],
  tunings: {
    standard: ["E", "A", "D", "G", "B", "E"],
  },
};

const midiToNote = (midi: number): string => {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return noteNames[midi % 12];
};

const InGuitar: React.FC<InGuitarProps> = ({ guitarChordName }) => {
const [showNotes] = useState(true);
const chords = guitarChords.chords as ChordsObject;

const chordKeyMap: Record<string, string> = {
  'C#': 'Csharp',
  'D#': 'Eb',     // no Dsharp in the JSON, so fallback to Eb
  'F#': 'Fsharp',
  'G#': 'Ab',
  'A#': 'Bb',
  'Db': 'Csharp',
  'Eb': 'Eb',
  'Gb': 'Fsharp',
  'Ab': 'Ab',
  'Bb': 'Bb',
};

const rootNoteMatch = guitarChordName.match(/^[A-G][b#]?/);
const rootNote = rootNoteMatch ? rootNoteMatch[0] : '';
const suffix = guitarChordName.slice(rootNote.length) || 'major';

const chordVariants = chords[chordKeyMap[rootNote] || rootNote] || [];

// console.log('Resolved root note key:', chordKeyMap[rootNote] || rootNote);

const suffixMap: Record<string, string> = {
  m: 'minor',
  maj: 'major',
  M7: 'maj7',
};

const normalizedSuffix = suffixMap[suffix] || suffix;

const selectedVariants = chordVariants.filter(
  (chord: any) => chord.suffix === normalizedSuffix
);

  // Add state for current variant index
  const [variantIndex, setVariantIndex] = useState(0);

  // Only show one chord position at a time
  const positions = selectedVariants[0]?.positions?.slice(variantIndex, variantIndex + 2) || [];

  return (
    <>
      
      <div className={`guitar-fretboard ${showNotes ? 'show-notes' : 'show-fingers'}`}>
        {/* <p>🎸 {guitarChordName} Chord (First 3 Shapes)</p> */}
        {positions.map((position: any, index: number) => (
          <div key={index} className="chord-shape-block">
            
            <div className="fret-pos">Fret {position.baseFret}</div>
            
            <Chord
              chord={{
                frets: position.frets,
                fingers: position.fingers,
                barres: position.barres,
                capo: position.capo || false,
                baseFret: position.baseFret,
              }}
              instrument={instrument}
              lite={false}
            />
            <div className="chord-overlay">
              {(showNotes ? position.midi : position.fingers).map((val: any, i: number) => (
                <span key={i} className="overlay-cell">
                  {val === 0 || val === undefined
                    ? ''
                    : showNotes
                    ? midiToNote(val)
                    : val}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="variant-navigation">
        <button
          onClick={() => setVariantIndex((i) => Math.max(0, i - 1))}
          disabled={variantIndex === 0}
        >
          ←
        </button>
        <br />
          {variantIndex + 1} & {variantIndex + 2} of {selectedVariants[0]?.positions?.length || 0}
        <br />
        <button
          onClick={() =>
            setVariantIndex((i) =>
              Math.min((selectedVariants[0]?.positions?.length || 1) - 1, i + 1)
            )
          }
          disabled={variantIndex >= (selectedVariants[0]?.positions?.length || 1) - 2}
        >
          →
        </button>
      </div>
    </>
  );
};

export default InGuitar;
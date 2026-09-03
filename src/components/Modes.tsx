import React, { useState } from 'react';
import './Chart.css';
import InStave from './In-Stave.tsx';

const modeFormulas: { [key: string]: number[] } = {
  Ionian: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10],
};

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteIndex = (note: string) => {
  return noteNames.indexOf(note);
};

const getNoteFromIndex = (index: number) => {
  return noteNames[(index + 12) % 12];
};

const getChordQuality = (intervals: number[]) => {
  const [i1, i2, i3] = [
    (intervals[1] - intervals[0] + 12) % 12,
    (intervals[2] - intervals[1] + 12) % 12,
    (intervals[3] - intervals[2] + 12) % 12,
  ];
  if (i1 === 3 && i2 === 4 && i3 === 3) return 'm7';     // minor 7th
  if (i1 === 4 && i2 === 3 && i3 === 4) return '7';      // dominant 7th
  if (i1 === 4 && i2 === 3 && i3 === 3) return 'maj7';     // major 7th
  if (i1 === 3 && i2 === 3 && i3 === 3) return 'm7b5';   // half-diminished (minor 7 flat 5)
  if (i1 === 3 && i2 === 3 && i3 === 6) return 'dim7';   // diminished 7th
  if (i1 === 3 && i2 === 4) return 'm';                   // minor triad
  if (i1 === 4 && i2 === 3) return '';                    // major triad
  if (i1 === 3 && i2 === 3) return 'dim';                 // diminished triad
  return '?'; // fallback
};

const getModeChords = (root: string, mode: string, sevenths: boolean = false): string[] => {
  const rootIndex = getNoteIndex(root);
  const intervals = modeFormulas[mode];
  if (!intervals) return [];

  const scale = intervals.map(semitone => getNoteFromIndex(rootIndex + semitone));
  const chords: string[] = [];

  for (let i = 0; i < 7; i++) {
    const rootNote = scale[i];
    const third = scale[(i + 2) % 7];
    const fifth = scale[(i + 4) % 7];

    if (sevenths) {
      const seventh = scale[(i + 6) % 7];
      const rootIdx = getNoteIndex(rootNote);
      const thirdIdx = getNoteIndex(third);
      const fifthIdx = getNoteIndex(fifth);
      const seventhIdx = getNoteIndex(seventh);

      let chordType = getChordQuality([rootIdx, thirdIdx, fifthIdx, seventhIdx]);
      switch (mode) {

        case 'Ionian':
          if (i === 0) chordType = 'maj7';
          else if (i === 1 || i === 2 || i === 5) chordType = 'm7';
          else if (i === 3) chordType = 'maj7'; //SubD
          else if (i === 4) chordType = '7';    //Domi
          else if (i === 6) chordType = 'm7b5'; //SubT
          break;

        case 'Dorian':
          if (i === 0 || i === 1 || i === 4) chordType = 'm7';
          else if (i === 2) chordType = 'maj7'; //Medi
          else if (i === 3) chordType = '7';    //Domi
          else if (i === 5) chordType = 'm7b5'; //SubM
          else if (i === 6) chordType = 'maj7'; //SubT
          break;

        case 'Phrygian':
          if (i === 0 || i === 3) chordType = 'm7';
          else if (i === 1 || i === 5) chordType = 'maj7'; //SupT*SubT
          else if (i === 2) chordType = '7';        //Medi
          else if (i === 4) chordType = 'm7b5';     //Domi
          break;

        case 'Lydian':
          if (i === 0 || i === 4) chordType = 'maj7';
          else if (i === 1) chordType = '7';    //SupT
          else if (i === 3) chordType = 'm7b5'; //SubD
          else if (i === 6) chordType = 'm7'; //SubT
          break;

        case 'Mixolydian':
          if (i === 0) chordType = '7';
          else if (i === 3 || i === 6) chordType = 'maj7';
          else if (i === 2) chordType = 'm7b5'; //Medi
          break;

        case 'Aeolian':
          if (i === 0 || i === 3 || i === 4) chordType = 'm7';
          else if (i === 1) chordType = 'm7b5';
          else if (i === 2 || i === 5) chordType = 'maj7';
          else if (i === 6) chordType = '7'; //SubT          
          break;

        case 'Locrian':
          if (i === 3 || i === 2 || i === 6) chordType = 'm7';
          else if (i === 1 || i === 4) chordType = 'maj7';
          else if (i === 0) chordType = 'm7b5';
          else if (i === 5) chordType = '7';
          break;
      }
      chords.push(`${rootNote}${chordType}`);
    } else {
      const rootIdx = getNoteIndex(rootNote);
      const thirdIdx = getNoteIndex(third);
      const fifthIdx = getNoteIndex(fifth);

      const chordType = getChordQuality([rootIdx, thirdIdx, fifthIdx]);
      chords.push(`${rootNote}${chordType}`);
    }
  }

  return chords;
};

const getRomanNumeral = (index: number, mode: string, showSevenths: boolean): string => {
  // Define base Roman numerals for scale degrees (1-based)
  // Uppercase = major, lowercase = minor, diminished = dim symbol, etc.
  // Also handle flats for subtonic (degree 7 in some modes)
  // The numerals below are based on standard diatonic functions in Ionian mode,
  // and adjusted per mode for sevenths.

  // We'll map scale degrees to Roman numerals with accidentals if needed.
  // Index is 0-based scale degree.

  // Base roman numerals without sevenths
  // const baseNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];

  // Adjustments per mode and degree for sevenths
  // We define a mapping for each mode of the numeral to use per degree with sevenths

  // For Ionian
  // const ionianSevenths = ['Imaj7', 'iim7', 'iiim7', 'IVmaj7', 'V7', 'vim7', 'viim7b5'];

  // For Dorian
  // const dorianSevenths = ['im7', 'iim7', 'IIImaj7', 'V7', 'vim7', 'viim7b5', 'VIImaj7'];

  // For Phrygian
  // const phrygianSevenths = ['im7', 'IImaj7', 'V7', 'vim7', 'viim7b5', 'IImaj7', 'V7'];

  // For Lydian
  // const lydianSevenths = ['Imaj7', 'V7', 'vim7b5', 'iiim7', 'IVmaj7', 'v7', 'vim7'];

  // For Mixolydian
  // const mixolydianSevenths = ['V7', 'iim7', 'vim7b5', 'IVmaj7', 'IIm7', 'v7', 'IVmaj7'];

  // For Aeolian
  // const aeolianSevenths = ['im7', 'vim7b5', 'IIImaj7', 'iv7', 'v7', 'VImaj7', 'VII7'];

  // For Locrian
  // const locrianSevenths = ['vim7b5', 'IImaj7', 'iv7', 'v7', 'VImaj7', 'VII7', 'im7'];

  // Because the above arrays don't align perfectly with scale degrees, and some modes have flats,
  // We'll instead hardcode the Roman numerals for the scale degrees used in the JSX:

  // The JSX references these scale degrees and their Roman numerals:
  // chords[5] -> Submediant (degree 6)
  // chords[1] -> Supertonic (degree 2)
  // chords[2] -> Mediant (degree 3)
  // chords[3] -> Subdominant (degree 4)
  // chords[0] -> Tonic (degree 1)
  // chords[4] -> Dominant (degree 5)
  // chords[6] -> Subtonic (degree 7)

  // We'll define a lookup table per mode and showSevenths for these degrees:

  const numeralsMap: { [mode: string]: { [degree: number]: string } } = {
    Ionian: {
      0: showSevenths ? 'Imaj7' : 'I',
      1: showSevenths ? 'iim7' : 'ii',
      2: showSevenths ? 'iiim7' : 'iii',
      3: showSevenths ? 'IVmaj7' : 'IV',
      4: showSevenths ? 'V7' : 'V',
      5: showSevenths ? 'vim7' : 'vi',
      6: showSevenths ? 'viim7b5' : 'vii',
    },
    Dorian: {
      0: showSevenths ? 'im7' : 'i',
      1: showSevenths ? 'iim7' : 'ii',
      2: showSevenths ? 'IIImaj7' : 'III',
      3: showSevenths ? 'V7' : 'V',
      4: showSevenths ? 'vim7' : 'vi',
      5: showSevenths ? 'viim7b5' : 'vii',
      6: showSevenths ? 'VIImaj7' : 'VII',
    },
    Phrygian: {
      0: showSevenths ? 'im7' : 'i',
      1: showSevenths ? 'IImaj7' : 'II',
      2: showSevenths ? 'V7' : 'V',
      3: showSevenths ? 'vim7' : 'vi',
      4: showSevenths ? 'viim7b5' : 'vii',
      5: showSevenths ? 'IImaj7' : 'II',
      6: showSevenths ? 'V7' : 'V',
    },
    Lydian: {
      0: showSevenths ? 'Imaj7' : 'I',
      1: showSevenths ? 'V7' : 'V',
      2: showSevenths ? 'vim7b5' : 'vii',
      3: showSevenths ? 'iiim7' : 'iii',
      4: showSevenths ? 'IVmaj7' : 'IV',
      5: showSevenths ? 'v7' : 'v',
      6: showSevenths ? 'vim7' : 'vi',
    },
    Mixolydian: {
      0: showSevenths ? 'V7' : 'V',
      1: showSevenths ? 'iim7' : 'ii',
      2: showSevenths ? 'vim7b5' : 'vii',
      3: showSevenths ? 'IVmaj7' : 'IV',
      4: showSevenths ? 'IIm7' : 'ii',
      5: showSevenths ? 'v7' : 'v',
      6: showSevenths ? 'IVmaj7' : 'IV',
    },
    Aeolian: {
      0: showSevenths ? 'im7' : 'i',
      1: showSevenths ? 'vim7b5' : 'vii',
      2: showSevenths ? 'IIImaj7' : 'III',
      3: showSevenths ? 'iv7' : 'iv',
      4: showSevenths ? 'v7' : 'v',
      5: showSevenths ? 'VImaj7' : 'VI',
      6: showSevenths ? 'VII7' : 'VII',
    },
    Locrian: {
      0: showSevenths ? 'vim7b5' : 'vii',
      1: showSevenths ? 'IImaj7' : 'II',
      2: showSevenths ? 'iv7' : 'iv',
      3: showSevenths ? 'v7' : 'v',
      4: showSevenths ? 'VImaj7' : 'VI',
      5: showSevenths ? 'VII7' : 'VII',
      6: showSevenths ? 'im7' : 'i',
    },
  };

  // If mode or index is not in map, fall back to basic roman numerals
  if (numeralsMap[mode] && numeralsMap[mode][index] !== undefined) {
    return numeralsMap[mode][index];
  }

  // Fallback for no sevenths: uppercase for 1,4,5; lowercase for 2,3,6; diminished for 7th
  if (!showSevenths) {
    const romanNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii'];
    return romanNumerals[index] || '?';
  }

  return '?';
};

interface ModesProps {
  onChordSelect: (chord: string) => void;
}

const Modes: React.FC<ModesProps> = ({ onChordSelect }) => {
  const [rootNote, setRootNote] = useState('C');
  const [showSevenths, setShowSevenths] = useState(false);


  const modeList = [
    { label: 'Ionian', offset: 0 },
    { label: 'Dorian', offset: -2 },
    { label: 'Phrygian', offset: -4 },
    { label: 'Lydian', offset: -5 },
    { label: 'Mixolydian', offset: -7 },
    { label: 'Aeolian', offset: -9 },
    { label: 'Locrian', offset: -11 },
  ];

  const normalizeKeySignature = (note: string) => {
    const enharmonicMap: { [note: string]: string } = {
      'A#': 'Bb',
      'D#': 'Eb',
      'G#': 'Ab',
      'C#': 'Db',
      'F#': 'Gb',
      'B': 'Cb',     // optional, depending on your notation
      'E#': 'F',
      'B#': 'C',
    };
    return enharmonicMap[note] || note;
  };

  const [selectedMode, setSelectedMode] = useState('Ionian');

  const selectedModeOffset = modeList.find(m => m.label === selectedMode)?.offset || 0;
  const rootIndex = getNoteIndex(rootNote);
  const parentIndex =
    selectedMode === 'Aeolian'
      ? (rootIndex + 3) % 12 // relative major: up 3 semitones
      : selectedMode === 'Ionian'
        ? rootIndex // Ionian is its own key
        : (rootIndex + selectedModeOffset + 12) % 12;
  const parentKey = getNoteFromIndex(parentIndex);

  const handleNote = (note: string) => {
    setRootNote(note);
    onChordSelect(note);
  };

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    
    onChordSelect(rootNote); // Refresh chords with the new mode
    // chords will update via useMemo below
  };

  const chords = React.useMemo(
    () => getModeChords(rootNote, selectedMode, showSevenths),
    [rootNote, selectedMode, showSevenths]
  );

  // Gather all borrowed chords for additional mode borrowing
  const borrowedChordsWithLabels: { [mode: string]: { chord: string, mode: string }[] } = {};
  const additionalBorrowModes = ['Dorian', 'Phrygian', 'Mixolydian', 'Lydian', 'Locrian'].filter(mode => mode !== selectedMode);
  additionalBorrowModes.forEach(mode => {
    const modeChords = getModeChords(rootNote, mode, showSevenths)
      .filter(chord => !chords.includes(chord));
    borrowedChordsWithLabels[mode] = modeChords.map(chord => ({ chord, mode }));
  });

  return (
    <div className="chord-chart">
      <div className="tool-title">🎨 Modes</div>

      {/* Black Notes */}
      <div className="piano-layout">
        <div className="half-gap"></div>
        <button
          className={`black-note ${rootNote === 'C#' ? 'selected-note' : ''}`}
          onClick={() => handleNote('C#')}
        >
          <b>C#</b> (Db)
        </button>
        <button className={`black-note ${rootNote === 'D#' ? 'selected-note' : ''}`} onClick={() => handleNote('D#')}>
          <b>D#</b> (Eb)
        </button>
        <div className="full-gap"></div>
        <button className={`black-note ${rootNote === 'F#' ? 'selected-note' : ''}`} onClick={() => handleNote('F#')}>
          <b>F#</b> (Gb)
        </button>
        <button className={`black-note ${rootNote === 'G#' ? 'selected-note' : ''}`} onClick={() => handleNote('G#')}>
          <b>G#</b> (Ab)
        </button>
        <button className={`black-note ${rootNote === 'A#' ? 'selected-note' : ''}`} onClick={() => handleNote('A#')}>
          <b>A#</b> (Bb)
        </button>
        <div className="half-gap"></div>
      </div>

      {/* White Notes */}
      <div className="piano-layout">
        <button
          className={`white-note ${rootNote === 'C' ? 'selected-note' : ''}`}
          onClick={() => handleNote('C')}
        >
          C
        </button>
        <button className={`white-note ${rootNote === 'D' ? 'selected-note' : ''}`} onClick={() => handleNote('D')}>
          D
        </button>
        <button className={`white-note ${rootNote === 'E' ? 'selected-note' : ''}`} onClick={() => handleNote('E')}>
          E
        </button>
        <button className={`white-note ${rootNote === 'F' ? 'selected-note' : ''}`} onClick={() => handleNote('F')}>
          F
        </button>
        <button className={`white-note ${rootNote === 'G' ? 'selected-note' : ''}`} onClick={() => handleNote('G')}>
          G
        </button>
        <button className={`white-note ${rootNote === 'A' ? 'selected-note' : ''}`} onClick={() => handleNote('A')}>
          A
        </button>
        <button className={`white-note ${rootNote === 'B' ? 'selected-note' : ''}`} onClick={() => handleNote('B')}>
          B
        </button>
      </div>

      <div className="mode-list">
        {modeList.map(({ label }) => {

          return (
            <button
              key={label}
              className={`chord-type${selectedMode === label ? ' selected' : ''}`}
              onClick={() => handleModeSelect(label)}
            >{label}</button>
          );
        })}
      </div>

      <div className="three-columns-grid">
        <div className="submediant">
          <span>Submediant</span><br />
          <button className="modeChord" onClick={() => onChordSelect(chords[5])}>{chords[5]}</button>
          <span className="cof-roman">{getRomanNumeral(5, selectedMode, showSevenths)}</span>
        </div>
        <div className="supertonic">
          <span>Supertonic</span><br />
          <button className="modeChord" onClick={() => onChordSelect(chords[1])}>{chords[1]}</button>
          <span className="cof-roman">{getRomanNumeral(1, selectedMode, showSevenths)}</span>
        </div>
        <div className="mediant">
          <span>Mediant</span><br />
          <button className="modeChord" onClick={() => onChordSelect(chords[2])}>{chords[2]}</button>
          <span className="cof-roman">{getRomanNumeral(2, selectedMode, showSevenths)}</span>
        </div>
      </div>

      <div className="three-columns-grid">
        <div className="subdominant"><span>Subdominant</span><br />
          <button className="modeChord" onClick={() => onChordSelect(chords[3])}>{chords[3]}</button>
          <span className="cof-roman">{getRomanNumeral(3, selectedMode, showSevenths)}</span>
        </div>
        <div className="tonic"><span>Tonic</span><br />
          <button className="modeChord" onClick={() => onChordSelect(chords[0])}>{chords[0]}</button>
          <span className="cof-roman">{getRomanNumeral(0, selectedMode, showSevenths)}</span>
        </div>
        <div className="dominant"><span>Dominant</span><br />
          <button className="modeChord" onClick={() => onChordSelect(chords[4])}>{chords[4]}</button>
          <span className="cof-roman">{getRomanNumeral(4, selectedMode, showSevenths)}</span></div>
      </div>

      <div className="three-columns-grid">



        <div>

          <div>
            <div className='keySig'>Key: <b>{parentKey}
              {parentKey === normalizeKeySignature(parentKey) ? "" : <> / {normalizeKeySignature(parentKey)}</>}</b></div>
            <div className="stave">
              <InStave keySignature={normalizeKeySignature(parentKey)} activeNotes={[]} />
            </div>

<div className='modeTitle'>{rootNote} {selectedMode}</div>

          </div>



        </div>

        <div className="subtonic">
          <span>Subtonic</span><br />
          <button className="modeChord" onClick={() => onChordSelect(chords[6])}>{chords[6]}</button>
          <span className="cof-roman">{getRomanNumeral(6, selectedMode, showSevenths)}</span>
        </div>

        <label className='seventh-tick'>
          <input
            type="checkbox"
            checked={showSevenths}
            onChange={() => setShowSevenths(!showSevenths)}
          /> Show 7th Chords
        </label>


      </div>



      {/* Relative Major/Minor Borrowing */}
      <div className="borrowed-group">
        <fieldset className='chord-group'>
          <legend className="chord-group-title">
            {selectedMode === 'Aeolian' && (
              <>Relative Major: {parentKey} Ionian</>
            )}
            {selectedMode === 'Ionian' && (
              <>Relative Minor: {parentKey} Aeolian</>
            )}
            {(selectedMode !== 'Aeolian' && selectedMode !== 'Ionian') && (
              <>Borrowed from {parentKey} Aeolian</>
            )}
          </legend>
          <div className="borrowed-chords">
            {(() => {
              const relativeMode = selectedMode === 'Aeolian' ? 'Ionian'
                                : selectedMode === 'Ionian' ? 'Aeolian'
                                : 'Aeolian';
              const relativeRoot = parentKey;
              const relativeChords = getModeChords(relativeRoot, relativeMode, showSevenths);

              return relativeChords.map((chord, index) => (
                <button className='modeChord' key={index} onClick={() => onChordSelect(chord)}>
                  {chord}
                </button>
              ));
            })()}
          </div>
        </fieldset>
      </div>

      {/* Additional Mode Borrowing */}
      {additionalBorrowModes.map((mode) => (
        <div className="borrowed-group" key={mode}>
          <fieldset className='chord-group'>
            <legend className="chord-group-title">Borrowed from {rootNote} {mode}</legend>
            <div className="borrowed-chords">
              {borrowedChordsWithLabels[mode].map(({ chord }, index) => (
                <button
                  className='modeChord'
                  key={index}
                  onClick={() => {
                   
                    onChordSelect(chord);
                  }}
                >
                  {chord}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ))}


    </div>
  );
};
export default Modes;
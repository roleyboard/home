import { useState } from 'react';
import './CoF.css';
import InStave from './In-Stave.tsx';


const enharmonicKeys: Record<string, string> = {

};

const keys = [
  { major: 'C', minor: 'Am' },
  { major: 'G', minor: 'Em' },
  { major: 'D', minor: 'Bm' },
  { major: 'A', minor: 'F#m' },
  { major: 'E', minor: 'C#m' },
  { major: 'B', minor: 'G#m' },
  { major: 'F#', minor: 'D#m' },
  { major: 'Db', minor: 'Bbm' },
  { major: 'Ab', minor: 'Fm' },
  { major: 'Eb', minor: 'Cm' },
  { major: 'Bb', minor: 'Gm' },
  { major: 'F', minor: 'Dm' },
];


const harmonicFunctions: Record<string, {
  tonic: string;
  subdominant: string;
  dominant: string;
  supertonic: string;
  submediant: string;
  mediant: string;
  subtonic: string;
}> = {
  A: { tonic: 'A', subdominant: 'D', dominant: 'E', supertonic: 'Bm', submediant: 'F#m', mediant: 'C#m', subtonic: 'G#dim' },
  Ab: { tonic: 'Ab', subdominant: 'Db', dominant: 'Eb', supertonic: 'Bbm', submediant: 'Fm', mediant: 'Cm', subtonic: 'Gdim' },
  Am: { tonic: 'Am', subdominant: 'Dm', dominant: 'Em', supertonic: 'Bdim', submediant: 'F', mediant: 'C', subtonic: 'G' },
  B: { tonic: 'B', subdominant: 'E', dominant: 'F#', supertonic: 'C#m', submediant: 'G#m', mediant: 'D#m', subtonic: 'A#dim' },
  Bb: { tonic: 'Bb', subdominant: 'Eb', dominant: 'F', supertonic: 'Cm', submediant: 'Gm', mediant: 'Dm', subtonic: 'Adim' },
  Bbm: { tonic: 'Bbm', subdominant: 'D#m', dominant: 'Fm', supertonic: 'Cdim', submediant: 'F#', mediant: 'Db', subtonic: 'Ab' },
  Bm: { tonic: 'Bm', subdominant: 'Em', dominant: 'F#m', supertonic: 'C#dim', submediant: 'G', mediant: 'D', subtonic: 'A' },
  C: { tonic: 'C', subdominant: 'F', dominant: 'G', supertonic: 'Dm', submediant: 'Am', mediant: 'Em', subtonic: 'Bdim' },
  'C#m': { tonic: 'C#m', subdominant: 'F#m', dominant: 'G#m', supertonic: 'D#dim', submediant: 'A', mediant: 'E', subtonic: 'B' },
  Cm: { tonic: 'Cm', subdominant: 'Fm', dominant: 'Gm', supertonic: 'Ddim', submediant: 'Ab', mediant: 'Eb', subtonic: 'Bb' },
  D: { tonic: 'D', subdominant: 'G', dominant: 'A', supertonic: 'Em', submediant: 'Bm', mediant: 'F#m', subtonic: 'C#dim' },
  'D#m': { tonic: 'D#m', subdominant: 'G#m', dominant: 'Bbm', supertonic: 'Fdim', submediant: 'B', mediant: 'F#', subtonic: 'Db' },
  Db: { tonic: 'Db', subdominant: 'F#', dominant: 'Ab', supertonic: 'D#m', submediant: 'Bbm', mediant: 'Fm', subtonic: 'Cdim' },
  Dm: { tonic: 'Dm', subdominant: 'Gm', dominant: 'Am', supertonic: 'Edim', submediant: 'Bb', mediant: 'F', subtonic: 'C' },
  E: { tonic: 'E', subdominant: 'A', dominant: 'B', supertonic: 'F#m', submediant: 'C#m', mediant: 'G#m', subtonic: 'D#dim' },
  Eb: { tonic: 'Eb', subdominant: 'Ab', dominant: 'Bb', supertonic: 'Fm', submediant: 'Cm', mediant: 'Gm', subtonic: 'Ddim' },
  Em: { tonic: 'Em', subdominant: 'Am', dominant: 'Bm', supertonic: 'F#dim', submediant: 'C', mediant: 'G', subtonic: 'D' },
  F: { tonic: 'F', subdominant: 'Bb', dominant: 'C', supertonic: 'Gm', submediant: 'Dm', mediant: 'Am', subtonic: 'Edim' },
  'F#': { tonic: 'F#', subdominant: 'B', dominant: 'Db', supertonic: 'G#m', submediant: 'D#m', mediant: 'Bbm', subtonic: 'Fdim' },
  'F#m': { tonic: 'F#m', subdominant: 'Bm', dominant: 'C#m', supertonic: 'G#dim', submediant: 'D', mediant: 'A', subtonic: 'E' },
  Fm: { tonic: 'Fm', subdominant: 'Bbm', dominant: 'Cm', supertonic: 'Gdim', submediant: 'Db', mediant: 'Ab', subtonic: 'Eb' },
  G: { tonic: 'G', subdominant: 'C', dominant: 'D', supertonic: 'Am', submediant: 'Em', mediant: 'Bm', subtonic: 'F#dim' },
  'G#m': { tonic: 'G#m', subdominant: 'C#m', dominant: 'D#m', supertonic: 'A#dim', submediant: 'E', mediant: 'B', subtonic: 'F#' },
  Gm: { tonic: 'Gm', subdominant: 'Cm', dominant: 'Dm', supertonic: 'Adim', submediant: 'Eb', mediant: 'Bb', subtonic: 'F' },
};



type CoFProps = {
  onChordSelect: (chord: string) => void;
};

export default function CoF({ onChordSelect }: CoFProps) {

  const [selectedChordName, setSelectedChordName] = useState('C');
  const [spinDeg, setSpinDeg] = useState(0);
  const [minorSpinDeg, setMinorSpinDeg] = useState(0);

  const canonicalName = enharmonicKeys[selectedChordName] || selectedChordName;
  const info = harmonicFunctions[canonicalName];


  const normalizeChord = (chord: string) =>
    chord
      .replace(/♯/g, '#')
      .replace(/♭/g, 'b')
      .replace(/°/g, 'dim')
      .toLowerCase();


  const normalizeInfo = {
    tonic: info.tonic,
    subdominant: info.subdominant,
    dominant: info.dominant,
    supertonic: info.supertonic,
    submediant: info.submediant,
    mediant: info.mediant,
    subtonic: info.subtonic,
  };

  const getFillColor = (chord: string): string => {
    const match = (target: string) =>
      normalizeChord(chord) === normalizeChord(target);

    if (match(normalizeInfo.tonic)) return 'green';
    if (match(normalizeInfo.subdominant)) return 'blue';
    if (match(normalizeInfo.dominant)) return 'red';
    if (match(normalizeInfo.supertonic)) return 'teal';
    if (match(normalizeInfo.submediant)) return 'orangered';
    if (match(normalizeInfo.mediant)) return 'purple';
    if (match(normalizeInfo.subtonic)) return 'saddlebrown';
    return 'grey';
  };

  const handleClick = (chord: string) => {
    const normalized = chord.toLowerCase();

    const clickedIndex = keys.findIndex(
      (key) =>
        key.major.toLowerCase() === normalized ||
        key.minor.toLowerCase() === normalized
    );




    if (clickedIndex === -1) {
      console.warn(`Chord not found: ${chord}`);
      return;
    }


    const isMinorClick = keys[clickedIndex].minor.toLowerCase() === normalized;
    const targetIndex = isMinorClick
      ? keys.findIndex((key) => key.major === keys[clickedIndex].major)
      : clickedIndex;

    const totalKeys = keys.length;
    const anglePerStep = 360 / totalKeys;

    const currentIndex = keys.findIndex(
      (key) =>
        key.major.toLowerCase() === selectedChordName.toLowerCase() ||
        key.minor.toLowerCase() === selectedChordName.toLowerCase()
    );



    let deltaMajor = targetIndex - currentIndex;
    if (Math.abs(deltaMajor) > totalKeys / 2) {
      deltaMajor = deltaMajor > 0 ? deltaMajor - totalKeys : deltaMajor + totalKeys;
    }


    const degreesMajor = deltaMajor * anglePerStep;


    let deltaMinor = -deltaMajor;
    const degreesMinor = deltaMinor * anglePerStep;


    setSelectedChordName(chord);
    setSpinDeg((prev) => (prev + degreesMajor) % 360);
    setMinorSpinDeg((prev) => (prev + degreesMinor) % 360);
    onChordSelect(chord);

  };

  return (

    <section className="music-container" aria-labelledby="music-heading">
      <div className="music-heading">
        <div>
          <p className="music-eyebrow">LEARN</p>
          <h2 id="music-heading">Circle of fifths</h2>
        </div>

      </div>


      {(() => {
        const isMinorKey = selectedChordName.endsWith('m');
        // For dominant, check if the chord is one of the major dominants in minor keys
        const roman = {
          tonic: isMinorKey ? 'i' : 'I',
          subdominant: isMinorKey ? 'iv' : 'IV',
          dominant: ['E', 'B', 'A', 'F', 'C', 'G', 'D'].includes(info.dominant) ? 'V' : 'v',
        };


        const handleNote = (note: string) => {
          onChordSelect(note);
        };


        return (
          <div>

            <div className="three-columns-grid">
              <div className="submediant">
                <span>Submediant</span><br />
                <button onClick={() => handleNote(info.submediant)}>{info.submediant}</button>
                <span className="cof-roman">{selectedChordName.endsWith('m') ? 'VI' : 'vi'}</span>
              </div>
              <div className="supertonic">
                <span>Supertonic</span><br />
                <button onClick={() => handleNote(info.supertonic)}>{info.supertonic}</button>
                <span className="cof-roman">ii</span>
              </div>
              <div className="mediant">
                <span>Mediant</span><br />
                <button onClick={() => handleNote(info.mediant)}>{info.mediant}</button>
                <span className="cof-roman">iii</span>
              </div>
            </div>
            <div className="three-columns-grid">
              <div className="subdominant"><span>Subdominant</span><br />
                <button onClick={() => handleNote(info.subdominant)}>{info.subdominant}</button>
                <span className="cof-roman">{roman.subdominant}</span></div>
              <div className="tonic"><span>Tonic</span><br />
                <button onClick={() => handleNote(info.tonic)}>{info.tonic}</button>
                <span className="cof-roman">{roman.tonic}</span></div>
              <div className="dominant"><span>Dominant</span><br />
                <button onClick={() => handleNote(info.dominant)}>{info.dominant}</button>
                <span className="cof-roman">{roman.dominant}</span></div>
            </div>
            <div className="three-columns-grid">

              <div>
                <div className='keySig'>Key of:
                  <b> {selectedChordName}</b>
                </div>
                <div className="stave">
                  <InStave keySignature={selectedChordName} activeNotes={[]} />
                </div>
              </div>

              <div className="subtonic">
                <span>Subtonic</span><br />
                <button onClick={() => handleNote(info.subtonic)}>{info.subtonic}</button>
                <span className="cof-roman">♭VII</span>
              </div>
              <div className="secondary-dominants">
                <span className='SD-Label'>Secondary Dominants</span>
                <ul>
                  {(() => {
                    const secondaries: { label: string; chord: string }[] = [];
                    const semitoneUp = (note: string, steps: number): string => {
                      const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                      const index = chromatic.indexOf(note.replace('m', '').replace('b', ''));
                      if (index === -1) return '?';
                      return chromatic[(index + steps) % 12];
                    };



                    const relativeChords = {
                      C: ['Dm', 'Em', 'F', 'G', 'Am'],
                      G: ['Am', 'Bm', 'C', 'D', 'Em'],
                      D: ['Em', 'F#m', 'G', 'A', 'Bm'],
                      A: ['Bm', 'C#m', 'D', 'E', 'F#m'],
                      E: ['F#m', 'G#m', 'A', 'B', 'C#m'],
                      B: ['G#m', 'A#m', 'B', 'C#', 'D#m'],
                      'F#': ['G#m', 'A#m', 'B', 'C#', 'D#m'],
                      Db: ['Ebm', 'Fm', 'Gb', 'Ab', 'Bbm'],
                      Ab: ['Bbm', 'Cm', 'Db', 'Eb', 'Fm'],
                      Eb: ['Fm', 'Gm', 'Ab', 'Bb', 'Cm'],
                      Bb: ['Cm', 'Dm', 'Eb', 'F', 'Gm'],
                      F: ['Gm', 'Am', 'Bb', 'C', 'Dm'],
                      Am: ['Dm', 'Em', 'F', 'G', 'C'],
                      Em: ['Am', 'Bm', 'C', 'D', 'G'],
                      Bm: ['Em', 'F#m', 'G', 'A', 'D'],
                      'F#m': ['Bm', 'C#m', 'D', 'E', 'A'],
                      'C#m': ['F#m', 'G#m', 'A', 'B', 'E'],
                      'G#m': ['C#m', 'D#m', 'E', 'F#', 'B'],
                      'D#m': ['G#m', 'A#m', 'B', 'C#', 'F#'],
                      Bbm: ['Ebm', 'Fm', 'Gb', 'Ab', 'Db'],
                      Fm: ['Bbm', 'Cm', 'Db', 'Eb', 'Ab'],
                      Cm: ['Fm', 'Gm', 'Ab', 'Bb', 'Eb'],
                      Gm: ['Cm', 'Dm', 'Eb', 'F', 'Bb'],
                      Dm: ['Gm', 'Am', 'Bb', 'C', 'F'],
                    };

                    const rels = relativeChords[selectedChordName as keyof typeof relativeChords];
                    if (rels) {
                      ['ii', 'iii', 'IV', 'V', 'vi'].forEach((roman, i) => {
                        const target = rels[i];
                        if (!target) return;
                        const fifth = semitoneUp(target[0], 7);
                        secondaries.push({ label: `V/${roman}`, chord: fifth });
                      });
                    }
                    return secondaries.map((entry) => (
                      <li key={entry.label}>
                        <strong>{entry.label}</strong>: {entry.chord}
                      </li>
                    ));
                  })()}
                </ul>
              </div>



            </div>
          </div>
        );
      })()}

      <div className="pane1">
        <svg viewBox="0 0 760 760" className="circle-svg">
          <g className="major-ring" style={{ transform: `rotate(${-spinDeg}deg)` }}>
            {keys.map((key, index) => {
              const angle = (index / keys.length) * 2 * Math.PI - Math.PI / 2;
              const x = 380 + 300 * Math.cos(angle);
              const y = 380 + 300 * Math.sin(angle);
              const angleDeg = (angle * 180) / Math.PI + 90;
              return (
                <g
                  key={`major-${index}`}
                  onClick={() => handleClick(key.major)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={45}
                    fill={getFillColor(key.major)}
                    stroke="var(--text-color)"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="45"
                    fill="white"
                    transform={`rotate(${angleDeg} ${x} ${y})`}
                  >
                    {key.major}
                  </text>
                </g>
              );
            })}
          </g>
          <g className="minor-ring" style={{ transform: `rotate(${minorSpinDeg}deg)` }}>
            {keys.map((key, index) => {
              const angle = (index / keys.length) * 2 * Math.PI - Math.PI / 2;
              const x = 380 + 200 * Math.cos(angle);
              const y = 380 + 200 * Math.sin(angle);
              const angleDeg = (angle * 180) / Math.PI + 90;
              return (
                <g
                  key={`minor-${index}`}
                  onClick={() => handleClick(key.minor)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={45}
                    fill={getFillColor(key.minor)}
                    stroke='var(--text-color)'
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="35"
                    fill="white"
                    transform={`rotate(${angleDeg} ${x} ${y})`}
                  >
                    {key.minor}
                  </text>
                </g>
              );
            })}
          </g>
          {(() => {

            const current = keys.find(
              (key) => key.major === selectedChordName || key.minor === selectedChordName
            );
            const dimMap: Record<string, string> = {
              C: 'B°', G: 'F#°', D: 'C#°', A: 'G#°', E: 'D#°', B: 'A#°',
              'F#': 'F°', Db: 'C°', Ab: 'G°', Eb: 'D°', Bb: 'A°', F: 'E°',
            };
            const resolved = current ? (dimMap[current.major] || '') : '';
            return (
              <g
                onClick={() => {
                  if (resolved) onChordSelect(resolved.replace('°', 'dim'));
                }}
                style={{ cursor: 'pointer' }}
                className="diminished-display"
              >
                <circle
                  cx="380"
                  cy="380"
                  r="45"
                  fill={getFillColor(resolved.replace('°', 'dim'))}
                  stroke="var(--text-color)"
                />
                <text
                  x="380"
                  y="380"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="45"
                  fill="white"
                >
                  {resolved}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>



      <div className="substitution">
        <fieldset>
          <legend>Tritone substitution for {selectedChordName}</legend>
          <div>
            Dominant → Tritone sub → Back to the Tonic
          </div>
          {(() => {
            const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const isMinor = selectedChordName.endsWith('m');
            const root = selectedChordName.replace('m', '');
            const tonicIndex = chromatic.indexOf(root);
            if (tonicIndex === -1) return null;

            let dominant: string;
            let tritoneSub: string;
            let resolution: string;

            if (isMinor) {

              const vIndex = (tonicIndex + 7) % 12;
              const vChord = chromatic[vIndex];
              const v7ofvIndex = (vIndex + 7) % 12;
              dominant = chromatic[v7ofvIndex] + '7';
              tritoneSub = chromatic[(v7ofvIndex + 6) % 12] + '7';
              resolution = vChord + 'm';
            } else {
              const dominantIndex = (tonicIndex + 7) % 12;
              dominant = chromatic[dominantIndex] + '7';
              tritoneSub = chromatic[(dominantIndex + 6) % 12] + '7';
              resolution = root + 'maj7';
            }

            return (
              <>
                <div>
                  <button
                    onClick={() => {
                      onChordSelect(dominant);
                      ;
                    }}
                  >
                    {dominant}
                  </button>
                  →
                  <button
                    onClick={() => {
                      onChordSelect(tritoneSub);
                      
                    }}
                  >
                    {tritoneSub}
                  </button>
                  →
                  <button
                    onClick={() => {
                      onChordSelect(resolution);
                       
                    }}
                  >
                    {resolution}
                  </button>
                </div>

                <span className='cof-roman'>{isMinor ? 'V7/v' : 'V7'}</span> →
                <span className='cof-roman'>♭II7</span> →
                <span className='cof-roman'>{isMinor ? 'v' : 'I'}</span>
              </>
            );
          })()}
        </fieldset>
      </div>


      <div className="substitution">
        <fieldset>
          <legend>Secondary Dominants in {selectedChordName}</legend>
          <div>
            Secondary Dominant → Target Chord
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(() => {
              const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
              const secondaries: { label: string; chord: string; target: string }[] = [];
              const semitoneUp = (note: string, steps: number): string => {
                const index = chromatic.indexOf(note.replace('m', '').replace('b', ''));
                if (index === -1) return '?';
                return chromatic[(index + steps) % 12];
              };

              const relativeChords = {
                C: ['Dm', 'Em', 'F', 'G', 'Am'],
                G: ['Am', 'Bm', 'C', 'D', 'Em'],
                D: ['Em', 'F#m', 'G', 'A', 'Bm'],
                A: ['Bm', 'C#m', 'D', 'E', 'F#m'],
                E: ['F#m', 'G#m', 'A', 'B', 'C#m'],
                B: ['G#m', 'A#m', 'B', 'C#', 'D#m'],
                'F#': ['G#m', 'A#m', 'B', 'C#', 'D#m'],
                Db: ['Ebm', 'Fm', 'Gb', 'Ab', 'Bbm'],
                Ab: ['Bbm', 'Cm', 'Db', 'Eb', 'Fm'],
                Eb: ['Fm', 'Gm', 'Ab', 'Bb', 'Cm'],
                Bb: ['Cm', 'Dm', 'Eb', 'F', 'Gm'],
                F: ['Gm', 'Am', 'Bb', 'C', 'Dm'],
                Am: ['Dm', 'Em', 'F', 'G', 'C'],
                Em: ['Am', 'Bm', 'C', 'D', 'G'],
                Bm: ['Em', 'F#m', 'G', 'A', 'D'],
                'F#m': ['Bm', 'C#m', 'D', 'E', 'A'],
                'C#m': ['F#m', 'G#m', 'A', 'B', 'E'],
                'G#m': ['C#m', 'D#m', 'E', 'F#', 'B'],
                'D#m': ['G#m', 'A#m', 'B', 'C#', 'F#'],
                Bbm: ['Ebm', 'Fm', 'Gb', 'Ab', 'Db'],
                Fm: ['Bbm', 'Cm', 'Db', 'Eb', 'Ab'],
                Cm: ['Fm', 'Gm', 'Ab', 'Bb', 'Eb'],
                Gm: ['Cm', 'Dm', 'Eb', 'F', 'Bb'],
                Dm: ['Gm', 'Am', 'Bb', 'C', 'F'],
              };

              const rels = relativeChords[selectedChordName as keyof typeof relativeChords];
              if (!rels) return null;

              ['ii', 'iii', 'IV', 'V', 'vi'].forEach((roman, i) => {
                const target = rels[i];
                if (!target) return;
                const fifth = semitoneUp(target[0], 7);
                secondaries.push({ label: `V7/${roman}`, chord: fifth + '7', target });
              });

              return secondaries.map((entry) => (
                <div key={entry.label}>
                  <button
                    onClick={() => {
                      onChordSelect(entry.chord);
                      
                    }}
                  >
                    {entry.chord}
                  </button>
                  →
                  <button
                    onClick={() => {
                      onChordSelect(entry.target);
                      
                    }}
                  >
                    {entry.target}
                  </button>
                  <span className="cof-roman">{entry.label}</span>
                </div>
              ));
            })()}
          </div>
        </fieldset>
      </div>


    </section>
  );
}

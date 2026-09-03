import React from 'react';
import './Progressions.css';

interface ProgressionsProps {
  onChordSelect: (chord: string) => void;
}

const Progressions: React.FC<ProgressionsProps> = ({ onChordSelect }) => {
  const handleNote = (chord: string) => {
    onChordSelect(chord);
  };

  // State for progression and key
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectedKey, setSelectedKey] = React.useState("C");

  // Key and progression data
  const keys = ["C", "D", "E", "F", "G", "A", "B"];
  const noteMap: { [key: string]: string[] } = {
    C: ["C", "D", "E", "F", "G", "A", "B"],
    D: ["D", "E", "F#", "G", "A", "B", "C#"],
    E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
    F: ["F", "G", "A", "A#", "C", "D", "E"],
    G: ["G", "A", "B", "C", "D", "E", "F#"],
    A: ["A", "B", "C#", "D", "E", "F#", "G#"],
    B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  };

  const progressions = [
    { label: "Pop Classic", roman: ["I", "V", "vi", "IV"], degrees: [0, 4, 5, 3] },
    { label: "Emotional Ballad", roman: ["vi", "IV", "I", "V"], degrees: [5, 3, 0, 4] },
    { label: "Classic Rock", roman: ["I", "IV", "V", "IV"], degrees: [0, 3, 4, 3] },
    { label: "Jazz Standard", roman: ["ii", "V", "I"], degrees: [1, 4, 0] },
    { label: "50s Progression", roman: ["I", "vi", "IV", "V"], degrees: [0, 5, 3, 4] },
    { label: "Jazz-Pop Turnaround", roman: ["I", "vi", "ii", "V"], degrees: [0, 5, 1, 4] },
    { label: "Aeolian Rock", roman: ["i", "♭VII", "♭VI", "♭VII"], degrees: [5, 4, 3, 4] },
    { label: "Mixolydian Rock", roman: ["I", "♭VII", "IV"], degrees: [0, 6, 3] },
    { label: "Pop Gold", roman: ["I", "IV", "vi", "V"], degrees: [0, 3, 5, 4] },
    { label: "Soulful Change", roman: ["I", "I7", "IV", "iv"], degrees: [0, 0, 3, 1] },
    { label: "Dreamy Colors", roman: ["I", "iii", "IV", "ii"], degrees: [0, 2, 3, 1] },
    { label: "Epic Final Battle", roman: ["i", "♭VI", "♭VII", "i"], degrees: [5, 3, 4, 5] },
    { label: "Sensitive Songwriter", roman: ["vi", "IV", "I", "V"], degrees: [5, 3, 0, 4] },
    { label: "Cinematic Minor", roman: ["i", "VI", "III", "VII"], degrees: [5, 3, 2, 6] },
  ];

  return (
    <div className="progressions">
      <div className="tool-title">🎹 Chord Progressions</div>

      <div className="progression-header">
        <label>Change Key:</label>
        <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
          {keys.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="progression-list">
        {progressions.map((prog, i) => (
          <div
            key={i}
            className={`progression-row ${i === selectedIndex ? "selected" : ""}`}
            onClick={() => setSelectedIndex(i)}
          >
            <div className="prog-roman">{prog.roman.join(" – ")}</div>
            <div className="prog-chords">
              {prog.degrees.map((degree, j) => {
                const chord = noteMap[selectedKey][degree];
                return (
                  <button key={j} className="prog-chord-button" onClick={() => handleNote(chord)}>
                    {prog.roman[j].toLowerCase() === prog.roman[j] ? chord + "m" : chord}
                  </button>
                );
              })}
            </div>
            {i === selectedIndex && (
              <div className="progression-info inline">
                {progressions[selectedIndex].label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Progressions;
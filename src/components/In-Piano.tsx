import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import "./In-Piano.css";

/**
 * @interface InPianoProps
 * @description Defines the props for the In-Piano component.
 * @param {string[]} activeNotes An array of note strings (e.g., 'C4', 'G5') to highlight.
 */
interface InPianoProps {
  activeNotes?: string[];
}

// Global AudioContext and buffer map for performance.
// These are outside the component to prevent re-creation on every render.
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
const bufferMap: { [note: string]: AudioBuffer } = {};

/**
 * @component InPiano
 * @description A virtual piano keyboard component that plays notes and highlights active ones.
 * @param {InPianoProps} props The component's props.
 * @returns {JSX.Element} The rendered piano component.
 */
const InPiano: React.FC<InPianoProps> = ({ activeNotes = [] }) => {
  // State to manage whether the sound is enabled.
  const [soundEnabled, setSoundEnabled] = useState(false);
  // Ref to track whether audio is loaded to avoid playing notes prematurely.
  const audioLoadedRef = useRef(false);

  /**
   * @constant notes
   * @description A memoized array of note strings representing the piano keys.
   * This is wrapped in useMemo to prevent it from being re-created on every render,
   * which satisfies the 'react-hooks/exhaustive-deps' linter rule.
   */
  const notes = useMemo(() => [
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
  ], []); // Empty dependency array: this array is constant and never changes.

  /**
   * @function playNoteAudio
   * @description A memoized callback function to play a specific note's audio.
   * This is wrapped in useCallback to prevent it from being re-created on every render,
   * which solves the 'react-hooks/exhaustive-deps' warning in the useEffect below.
   * @param {string} note The note string to play.
   */
  const playNoteAudio = useCallback((note: string) => {
    // If sound is disabled or the audio hasn't been loaded, do nothing.
    if (!soundEnabled || !audioLoadedRef.current) return;
    const buffer = bufferMap[note];
    if (buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    }
  }, [soundEnabled]); // Only re-create this function if `soundEnabled` changes.

  /**
   * @useEffect
   * @description Fetches and decodes the audio files for all notes.
   * This effect runs only once because its dependency array contains a constant memoized array.
   */
  useEffect(() => {
    // Keep track of the number of audio files to load.
    let notesToLoad = notes.length;

    notes.forEach((note) => {
      if (!bufferMap[note]) {
        fetch(`/media/${encodeURIComponent(note)}.mp3`)
          .then((response) => response.arrayBuffer())
          .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
          .then((audioBuffer) => {
            bufferMap[note] = audioBuffer;
            // Decrement the counter and set audioLoadedRef when all files are loaded.
            notesToLoad--;
            if (notesToLoad === 0) {
              audioLoadedRef.current = true;
            }
          })
          .catch((err) => {
            console.warn(`Failed to load or decode audio for ${note}:`, err);
          });
      }
    });
  }, [notes]); // `notes` is added to the dependency array.

  /**
   * @useEffect
   * @description Plays the audio for any notes that are active.
   * This effect runs whenever the `activeNotes` prop or the `playNoteAudio` function changes.
   */
  useEffect(() => {
    // Ensure the audio is loaded before attempting to play notes.
    if (audioLoadedRef.current) {
      activeNotes.forEach((note) => playNoteAudio(note));
    }
  }, [activeNotes, playNoteAudio, notes]); // `notes` is added to the dependency array here.

  return (
    <>
      <div className="w3switch">
        <span><b>Piano Sound:</b></span>
        <label className="switch">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={() => setSoundEnabled(!soundEnabled)}
          />
          <span className="slider" />
        </label>
        <span style={{ marginLeft: "10px" }}>{soundEnabled ? '🔊' : '🔇'}</span>
      </div>

      <div className="piano-container">
        <div className="in-piano">
          {notes.map((note) => {
            const cleanedActiveNotes = activeNotes
              .map(n => n.split('/')[0]) // take only main chord before slash
              .flatMap(n => {
                // basic chord-to-notes mapping fallback (handles simple cases like Eb, Dm, etc.)
                const root = n.replace(/m|maj7|7|dim|aug|sus|add.*/i, '');
                return [root];
              });
            const isSharp = note.includes("#");
            const isActive = cleanedActiveNotes.includes(note);
            return (
              <div
                key={note}
                className={`key ${isSharp ? "black" : "white"} ${isActive ? "active" : ""}`}
                onClick={() => playNoteAudio(note)}
              >
                {isActive && <div className="finger-dot" />}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default InPiano;

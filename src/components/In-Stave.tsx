import { Renderer, Stave, StaveNote, Formatter, Accidental } from 'vexflow';
import React, { useEffect, useRef } from 'react';
import "./In-Stave.css";

interface InStaveProps {
  activeNotes: string[];         // e.g. ['C4', 'E#4', 'G4']
  keySignature?: string;         // e.g. 'C', 'G', 'F#', 'Bb', 'Am'
}

const InStave: React.FC<InStaveProps> = ({ activeNotes, keySignature }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = ''; // Clear previous render

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(240, 112); // WIDTH (30 more than Container WIDTH), HEIGHT (100)
    const context = renderer.getContext();

    const stave = new Stave(5, 0, 210); // 5-leftmargin, 0-Top, Container WIDTH
    if (keySignature) {
      stave.addClef('treble').addKeySignature(keySignature);
    } else {
      stave.addClef('treble');
    }
    stave.setContext(context).draw();

    if (activeNotes.length > 0) {
      const notes = activeNotes.map((note) => {
        const [, letter, accidental = '', octave] = note.match(/^([A-Ga-g])([#b]?)(\d)$/) || [];
        const key = `${letter.toLowerCase()}${accidental}/${octave}`;
        const staveNote = new StaveNote({ keys: [key], duration: 'q' });
        if (accidental) {
          staveNote.addModifier(new Accidental(accidental), 0);
        }
        return staveNote;
      });

      Formatter.FormatAndDraw(context, stave, notes);
    }
  }, [activeNotes, keySignature]);

  return <div className="stave-container" ref={containerRef}></div>;
};

export default InStave;
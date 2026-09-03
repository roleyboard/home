import React from 'react';

interface InversionProps {
  coreNotes: string[];
  invertedNotes: string[];
  inversion: number;
  setInversion: (index: number) => void;
}

const Inversion: React.FC<InversionProps> = ({
  coreNotes,
  invertedNotes,
  inversion,
  setInversion,
}) => {
  const voicingLabel =
    inversion === 0 ? 'Root:'
    : inversion === 1 ? '1st Inv:'
    : inversion === 2 ? '2nd Inv:'
    : inversion === 3 ? '3rd Inv:'
    : inversion === 4 ? '4th Inv:'
    : inversion === 5 ? '5th Inv:'
    : `Inversion ${inversion}`;

  return (
    <div className="inversion">
      {Array.from({ length: coreNotes.length }, (_, i) => (
        <button key={i} onClick={() => setInversion(i)}>
          {i === 0 ? 'R' : `${i}`}
        </button>
      ))}
      <div>
        {voicingLabel}
        {invertedNotes.length > 0 && (
          <span> ({invertedNotes.join(' ')})</span>
        )}
      </div>
    </div>
  );
};

export default Inversion;
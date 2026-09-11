import React from "react";
import './In-Nav.css';

interface InNavProps {
  onTogglePiano: () => void;
  onToggleGuitar: () => void;
  onToggleStave: () => void;
  onClose: () => void;
  showPiano: boolean;
  showGuitar: boolean;
  showStave: boolean;
}

const InNav: React.FC<InNavProps> = ({
  onTogglePiano,
  onToggleGuitar,
  onToggleStave,
  onClose,
  showPiano,
  showGuitar,
  showStave,
}) => {
  return (
   
    <div className="insight-buttons">

      <button
        onClick={onToggleGuitar}
        className={showGuitar ? "selected" : ""}
      >
        🎸
      </button>

      <button
        onClick={onTogglePiano}
        className={showPiano ? "selected" : ""}
      >
        🎹
      </button>

      <button
        onClick={onToggleStave}
        className={showStave ? "selected" : ""}
      >
        🎼
      </button>

      <button
        type="button"
        className="close-button selected-chord-close"
        onClick={onClose}
        aria-label="Close chord display"
      >
        <span aria-hidden="true">&times;</span>
      </button>

    </div>
  );
};

export default InNav;
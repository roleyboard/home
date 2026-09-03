import React from "react";
import './In-Nav.css';

interface InNavProps {
  onTogglePiano: () => void;
  onToggleGuitar: () => void;
  onToggleStave: () => void;
  // onToggleLlama: () => void;
  showPiano: boolean;
  showGuitar: boolean;
  showStave: boolean;
  // showLlama: boolean;
}

const InNav: React.FC<InNavProps> = ({
  onTogglePiano,
  onToggleGuitar,
  onToggleStave,
  // onToggleLlama,
  showPiano,
  showGuitar,
  showStave,
  // showLlama,
  
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

      {/* <button
        onClick={onToggleLlama}
        className={showLlama ? "selected" : ""}
      >
        🦙
      </button> */}

    </div>
  );
};

export default InNav;
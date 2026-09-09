import { useEffect, useRef, useState } from 'react';

interface TabsTABProps {
  source: string;
  title: string;
  subTitle: string;
  image: string;
  onClose: () => void;
  onChordSelect: (chord: string) => void;
}

const chordPattern = /^[A-G](?:#|b)?(?:maj|min|m|dim|aug|sus|add)?\d*(?:sus\d*)?(?:\/[A-G](?:#|b)?)?$/;
const sectionPattern = /^\s*\[([^\]]+)\]\s*$/;

export default function TabsTab({ source, title, subTitle, image, onClose, onChordSelect }: TabsTABProps) {
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAutoScrolling) return;

    const interval = window.setInterval(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const atEnd = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2;
      if (atEnd) {
        setIsAutoScrolling(false);
        return;
      }

      viewport.scrollTop += scrollSpeed;
    }, 40);

    return () => window.clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed]);

  return (
    <div className="tab-viewer" ref={viewportRef}>
      <div className="tab-toolbar">
        <img className="tab-toolbar-image" src={`/covers/${image}`} alt="" />
        <div className="tab-toolbar-title">
          <h2 id="tab-dialog-title">{title}</h2>
          {subTitle && <p>{subTitle}</p>}
        </div>
        <div className="tab-controls" aria-label="TAB controls">
          <button type="button" className="sheet-control" onClick={() => setIsAutoScrolling((isScrolling) => !isScrolling)}>
            <span aria-hidden="true">{isAutoScrolling ? 'Ⅱ' : '▶'}</span>
            {isAutoScrolling ? 'Pause scroll' : 'Auto-scroll'}
          </button>
          <button type="button" className="sheet-control" onClick={() => setScrollSpeed((speed) => (speed >= 3 ? 1 : speed + 1))}>
            Speed {scrollSpeed}x
          </button>
        </div>
        <button type="button" className="close-button sheet-close" onClick={onClose} aria-label="Close tab">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className="tab-content">
        {source.split('\n').map((line, lineIndex) => {
          const section = line.match(sectionPattern);
          if (section) {
            return <h3 className="tab-section-heading" key={lineIndex}>{section[1]}</h3>;
          }

          return (
            <div className="tab-line" key={lineIndex}>
              {line.split(/(\s+)/).map((part, partIndex) => {
                if (!part || /^\s+$/.test(part) || !chordPattern.test(part)) {
                  return <span key={partIndex}>{part}</span>;
                }

                return (
                  <button type="button" className="tab-chord" key={partIndex} onClick={() => onChordSelect(part)}>
                    {part}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
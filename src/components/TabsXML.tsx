import { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import TabsTab from './TabsTAB';

interface TabsXMLProps {
  fileName: string;
  title: string;
  subTitle: string;
  image: string;
  mode: 'score' | 'source';
  onClose: () => void;
  onChordSelect: (chord: string) => void;
}

export default function TabsXML({ fileName, title, subTitle, image, mode, onClose, onChordSelect }: TabsXMLProps) {
  const [source, setSource] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const notationRef = useRef<HTMLDivElement | null>(null);
  const notationViewportRef = useRef<HTMLDivElement | null>(null);
  const extension = fileName.split('.').pop()?.toUpperCase() ?? 'FILE';
  const isScore = mode === 'score';
  const isMusicXml = isScore && extension === 'MUSICXML';
  const isTab = isScore && extension === 'TAB';
  const refreshTab = () => {
    setIsLoading(true);
    setError('');
    setRefreshToken((token) => token + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/tabs/${encodeURIComponent(fileName)}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${fileName}`);
        return response.text();
      })
      .then(setSource)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setError(fetchError instanceof Error ? fetchError.message : `Could not load the ${extension} file`);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [extension, fileName, refreshToken]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (!isMusicXml || !notationRef.current || !source || isLoading || error) return;

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--text-h').trim() || '#222222';

    const notation = new OpenSheetMusicDisplay(notationRef.current, {
      autoResize: true,
      backend: 'svg',
      pageFormat: 'Endless',
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawCredits: false,
      drawPartNames: false,
      drawPartAbbreviations: false,
      drawMeasureNumbers: false,
      drawTimeSignatures: true,
      drawLyrics: true,
      defaultFontFamily: 'Helvetica',
      defaultColorMusic: textColor,
      defaultColorLabel: textColor,
      drawingParameters: 'compacttight',
    });

    notation.load(source).then(() => notation.render()).catch(() => setError(`Could not render this ${extension} file.`));

    return () => notation.clear();
  }, [error, extension, isLoading, isMusicXml, source]);

  useEffect(() => {
    if (!isAutoScrolling || !isMusicXml) return;

    const interval = window.setInterval(() => {
      const viewport = notationViewportRef.current;
      if (!viewport) return;
      const atEnd = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2;
      if (atEnd) {
        setIsAutoScrolling(false);
        return;
      }
      viewport.scrollTop += scrollSpeed;
    }, 40);

    return () => window.clearInterval(interval);
  }, [isAutoScrolling, isMusicXml, scrollSpeed]);

  return (
    <div className="tabs-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={isTab ? 'sheet-dialog tab-dialog' : isScore ? 'sheet-dialog' : 'source-dialog'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tab-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!isTab && (
          <header className="sheet-toolbar">
            <div>
              <p className="tabs-eyebrow">{isMusicXml ? 'MusicXML score' : `Raw ${extension}`}</p>
              <h2 id="tab-dialog-title">{title}</h2>
            </div>
            <button type="button" className="close-button sheet-close" onClick={onClose} aria-label="Close tab">
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
        )}

        {isMusicXml && (
          <div className="sheet-controls" aria-label="Score controls">
            <button type="button" className="sheet-control" onClick={() => setIsAutoScrolling((isScrolling) => !isScrolling)} disabled={isLoading || Boolean(error)}>
              <span aria-hidden="true">{isAutoScrolling ? 'Ⅱ' : '▶'}</span>
              {isAutoScrolling ? 'Pause scroll' : 'Auto-scroll'}
            </button>
            <button type="button" className="sheet-control sheet-speed" onClick={() => setScrollSpeed((speed) => (speed >= 3 ? 1 : speed + 1))} aria-label={`Scroll speed ${scrollSpeed}. Change speed`}>
              Speed {scrollSpeed}x
            </button>
          </div>
        )}

        {isLoading && <p className="tabs-status">Loading {extension}...</p>}
        {error && <p className="tabs-status tabs-error">{error}</p>}
        {!isLoading && !error && isTab && <TabsTab source={source} title={title} subTitle={subTitle} image={image} onClose={onClose} onRefresh={refreshTab} onChordSelect={onChordSelect} />}
        {!isLoading && !error && isMusicXml && <div className="notation-viewer sheet-viewer" ref={notationViewportRef} aria-live="polite"><div ref={notationRef} /></div>}
        {!isLoading && !error && !isScore && <pre className="musicxml-source">{source}</pre>}
      </section>
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

import { tabFiles } from '../data/tabs';
import './Tabs.css';

export default function Tabs() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [musicXml, setMusicXml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const notationRef = useRef<HTMLDivElement | null>(null);
  const notationViewportRef = useRef<HTMLDivElement | null>(null);

  const selectedTab = tabFiles.find((tabFile) => tabFile.fileName === selectedFile);

  const openTab = (fileName: string) => {
    setSelectedFile(fileName);
    setIsViewerOpen(true);
    setIsSourceOpen(false);
    setIsLoading(true);
    setIsAutoScrolling(false);
    setMusicXml('');
    setError('');
  };

  const openSource = (fileName: string) => {
    setSelectedFile(fileName);
    setIsSourceOpen(true);
    setIsViewerOpen(false);
    setIsLoading(true);
    setMusicXml('');
    setError('');
  };

  const closeOverlays = () => {
    setIsViewerOpen(false);
    setIsSourceOpen(false);
    setIsAutoScrolling(false);
  };

  useEffect(() => {
    const controller = new AbortController();

    if (!selectedFile) return;

    fetch(`/tabs/${encodeURIComponent(selectedFile)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${selectedFile}`);
        }
        return response.text();
      })
      .then(setMusicXml)
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setMusicXml('');
        setError(fetchError instanceof Error ? fetchError.message : 'Could not load the MusicXML file');
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [selectedFile]);

  useEffect(() => {
    if (!isViewerOpen && !isSourceOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlays();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isSourceOpen, isViewerOpen]);

  useEffect(() => {
    if (!isViewerOpen || !notationRef.current || !musicXml || isLoading || error) return;

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
      defaultColorMusic: '#222222',
      defaultColorLabel: '#222222',
      drawingParameters: 'compacttight',
    });

    notation
      .load(musicXml)
      .then(() => notation.render())
      .catch(() => setError('Could not render this MusicXML file.'));

    return () => {
      notation.clear();
    };
  }, [error, isLoading, isViewerOpen, musicXml]);

  useEffect(() => {
    if (!isAutoScrolling || !isViewerOpen) return;

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
  }, [isAutoScrolling, isViewerOpen, scrollSpeed]);

  return (
    <section className="music-container" aria-labelledby="music-heading">
      <div className="music-heading">
        <div>
          <p className="music-eyebrow">LEARN</p>
          <h2 id="music-heading">Tabs</h2>
        </div>
        <p className="tabs-count">{tabFiles.length} scores</p>
      </div>

      <div className="song-list tab-list" aria-label="MusicXML scores">
        {tabFiles.map((tabFile, index) => (
          <article className="song-card tab-card" key={tabFile.fileName}>
            <button type="button" className="song-select tab-select" onClick={() => openTab(tabFile.fileName)}>
              <span className="queue-position">{index + 1}</span>
              <img className="song-cover" src={`/covers/${tabFile.img}`} alt="" />
              <span className="song-copy">
                <span className="song-title">{tabFile.title}</span>
                <span className="song-subtitle">Tap to open</span>
              </span>
              <span className="row-play" aria-hidden="true">&#9654;</span>
            </button>
            <button
              type="button"
              className="tab-source-button"
              onClick={() => openSource(tabFile.fileName)}
              aria-label={`View raw XML for ${tabFile.title}`}
              title="View raw XML"
            >
              &lt;/&gt;
            </button>
          </article>
        ))}
      </div>

      {isViewerOpen && selectedTab && (
        <div className="tabs-backdrop" role="presentation" onMouseDown={closeOverlays}>
          <section
            className="sheet-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sheet-toolbar">
              <div>
                <p className="tabs-eyebrow">MusicXML score</p>
                <h2 id="sheet-title">{selectedTab.title}</h2>
              </div>
              <button type="button" className="sheet-close" onClick={closeOverlays} aria-label="Close score">
                <span aria-hidden="true">&times;</span>
              </button>
            </header>

            <div className="sheet-controls" aria-label="Score controls">
              <button
                type="button"
                className="sheet-control"
                onClick={() => setIsAutoScrolling((isScrolling) => !isScrolling)}
                disabled={isLoading || Boolean(error)}
              >
                <span aria-hidden="true">{isAutoScrolling ? 'Ⅱ' : '▶'}</span>
                {isAutoScrolling ? 'Pause scroll' : 'Auto-scroll'}
              </button>
              <button
                type="button"
                className="sheet-control sheet-speed"
                onClick={() => setScrollSpeed((speed) => (speed >= 3 ? 1 : speed + 1))}
                aria-label={`Scroll speed ${scrollSpeed}. Change speed`}
              >
                Speed {scrollSpeed}x
              </button>
            </div>

            <div className="notation-viewer sheet-viewer" ref={notationViewportRef} aria-live="polite">
              {isLoading && <p className="tabs-status">Loading MusicXML...</p>}
              {error && <p className="tabs-status tabs-error">{error}</p>}
              {!isLoading && !error && <div ref={notationRef} />}
            </div>
          </section>
        </div>
      )}

      {isSourceOpen && selectedTab && (
        <div className="tabs-backdrop" role="presentation" onMouseDown={closeOverlays}>
          <section
            className="source-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="sheet-toolbar">
              <div>
                <p className="tabs-eyebrow">Raw MusicXML</p>
                <h2 id="source-title">{selectedTab.title}</h2>
              </div>
              <button type="button" className="sheet-close" onClick={closeOverlays} aria-label="Close raw XML">
                <span aria-hidden="true">&times;</span>
              </button>
            </header>
            {isLoading && <p className="tabs-status">Loading MusicXML...</p>}
            {error && <p className="tabs-status tabs-error">{error}</p>}
            {!isLoading && !error && <pre className="musicxml-source">{musicXml}</pre>}
          </section>
        </div>
      )}
    </section>
  );
}

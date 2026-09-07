import { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

import { tabFiles } from '../data/tabs';
import './Tabs.css';

export default function Tabs() {
  const [selectedFile, setSelectedFile] = useState(tabFiles[0].fileName);
  const [musicXml, setMusicXml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const notationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

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
    if (!notationRef.current || !musicXml || isLoading || error) return;

    const notation = new OpenSheetMusicDisplay(notationRef.current, {
      autoResize: true,
      backend: 'canvas',
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
  }, [error, isLoading, musicXml]);

  return (
    <section className="tabs-container" aria-labelledby="tabs-heading">
      <div className="tabs-heading">
        <div>
          <p className="tabs-eyebrow">MusicXML library</p>
          <h2 id="tabs-heading">Choose a tab</h2>
        </div>
        <label className="tab-picker-label" htmlFor="tab-picker">
          Select a file
          <select
            id="tab-picker"
            className="tab-picker"
            value={selectedFile}
            onChange={(event) => {
              setIsLoading(true);
              setError('');
              setSelectedFile(event.target.value);
            }}
          >
            {tabFiles.map((tabFile) => (
              <option key={tabFile.fileName} value={tabFile.fileName}>
                {tabFile.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="notation-viewer" aria-live="polite">
        {isLoading && <p className="tabs-status">Loading MusicXML...</p>}
        {error && <p className="tabs-status tabs-error">{error}</p>}
        {!isLoading && !error && <div ref={notationRef} />}
      </div>

      {!isLoading && musicXml && (
        <details className="musicxml-source">
          <summary>View MusicXML source</summary>
          <pre>{musicXml}</pre>
        </details>
      )}
    </section>
  );
}

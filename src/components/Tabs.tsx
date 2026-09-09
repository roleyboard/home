import { useState } from 'react';

import { tabFiles } from '../data/tabs';
import TabsXML from './TabsXML';
import './Tabs.css';

interface TabsProps {
  onChordSelect: (chord: string) => void;
}

export default function Tabs({ onChordSelect }: TabsProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'score' | 'source' | null>(null);

  const selectedTab = tabFiles.find((tabFile) => tabFile.fileName === selectedFile);

  const openTab = (fileName: string) => {
    setSelectedFile(fileName);
    const extension = fileName.split('.').pop()?.toLowerCase();
    setViewMode(extension === 'musicxml' || extension === 'tab' ? 'score' : 'source');
  };

  const openSource = (fileName: string) => {
    setSelectedFile(fileName);
    setViewMode('source');
  };

  const closeOverlays = () => {
    setViewMode(null);
  };

  return (
    <section className="music-container" aria-labelledby="music-heading">
      <div className="music-heading">
        <div>
          <p className="music-eyebrow">LEARN</p>
          <h2 id="music-heading">Tabs</h2>
        </div>
        <p className="tabs-count">{tabFiles.length} files</p>
      </div>

      <div className="song-list tab-list" aria-label="Music notation files">
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
              aria-label={`View raw ${tabFile.fileName.split('.').pop()?.toUpperCase() ?? 'file'} for ${tabFile.title}`}
              title="View raw file"
            >
              &lt;/&gt;
            </button>
          </article>
        ))}
      </div>

      {selectedTab && viewMode && (
        <TabsXML
          key={`${selectedTab.fileName}-${viewMode}`}
          fileName={selectedTab.fileName}
          title={selectedTab.title}
          subTitle={selectedTab.subTitle}
          image={selectedTab.img}
          mode={viewMode}
          onClose={closeOverlays}
          onChordSelect={onChordSelect}
        />
      )}
    </section>
  );
}

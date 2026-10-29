import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const karaokeDirectory = resolve(__dirname, 'public/karaoke')

async function discoverKaraokeSongs() {
  const files = await readdir(karaokeDirectory)
  const byLowercaseName = new Map(files.map((file) => [file.toLowerCase(), file]))
  const stemName = /_(?:vocal|vocals|backing_vocals|drums|bass|guitar|keyboard|background)\.(?:ogg|mp3)$/i
  const lyricFiles = files.filter((file) => file.toLowerCase().endsWith('.lrc'))

  return lyricFiles
    .map((lyricsFile) => {
      const title = lyricsFile.slice(0, -4)
      const matchingAudio = byLowercaseName.get(`${title}.mp3`.toLowerCase())
      const hasStemAudio = files.some((file) => {
        const lowerFile = file.toLowerCase()
        return lowerFile.startsWith(`${title}_`.toLowerCase()) && stemName.test(file)
      })
      if (!matchingAudio && !hasStemAudio) return null

      const chordFile = byLowercaseName.get(`${title}.chords`.toLowerCase())
      return {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        title,
        audio: matchingAudio ? `/karaoke/${encodeURIComponent(matchingAudio)}` : '',
        lyrics: `/karaoke/${encodeURIComponent(lyricsFile)}`,
        chords: chordFile ? `/karaoke/${encodeURIComponent(chordFile)}` : '',
      }
    })
    .filter((song) => song !== null)
    .sort((left, right) => left.title.localeCompare(right.title))
}

function karaokeCatalogPlugin(): Plugin {
  let isProductionBuild = false
  return {
    name: 'karaoke-song-catalog',
    configResolved(config) {
      isProductionBuild = config.command === 'build'
    },
    configureServer(server) {
      server.middlewares.use('/karaoke/songs.json', async (request, response, next) => {
        if (request.method !== 'GET') return next()
        try {
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(JSON.stringify(await discoverKaraokeSongs()))
        } catch (error) {
          next(error instanceof Error ? error : new Error('Could not scan the karaoke folder.'))
        }
      })
    },
    async buildStart() {
      if (!isProductionBuild) return
      this.emitFile({
        type: 'asset',
        fileName: 'karaoke/songs.json',
        source: JSON.stringify(await discoverKaraokeSongs()),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), karaokeCatalogPlugin()],
  resolve: {
    alias: {
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
    },
  },
})

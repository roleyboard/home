import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const karaokeDirectory = resolve(__dirname, 'public/karaoke')

async function discoverKaraokeSongs() {
  const files = await readdir(karaokeDirectory)
  const fileSet = new Set(files)
  const stemMp3 = /_(?:vocal|vocals|backing_vocals|drums|bass|guitar|keyboard|background)\.mp3$/i

  return files
    .filter((file) => file.toLowerCase().endsWith('.mp3') && !stemMp3.test(file))
    .map((file) => file.slice(0, -4))
    .filter((title) => fileSet.has(`${title}.lrc`))
    .sort((left, right) => left.localeCompare(right))
    .map((title) => {
      const encodedTitle = encodeURIComponent(title)
      return {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        title,
        audio: `/karaoke/${encodedTitle}.mp3`,
        lyrics: `/karaoke/${encodedTitle}.lrc`,
        chords: fileSet.has(`${title}.chords`) ? `/karaoke/${encodedTitle}.chords` : '',
      }
    })
}

function karaokeCatalogPlugin(): Plugin {
  return {
    name: 'karaoke-song-catalog',
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

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import UnoCss from 'unocss/vite'
import presetIcons from '@unocss/preset-icons'
import presetUno from '@unocss/preset-uno'
import { extractorSvelte } from '@unocss/core'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src')
    },
  },
  plugins: [
    UnoCss({
      extractors: [extractorSvelte],
      shortcuts: [],
      presets: [
        presetUno(),
        presetIcons(),
      ],
    }),
    svelte(),
  ],
})

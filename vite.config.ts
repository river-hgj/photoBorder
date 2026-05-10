import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isHarmony = mode === 'harmony'

  return {
    base: './',
    define: {
      __HARMONY_RAWFILE__: JSON.stringify(isHarmony),
    },
    plugins: [react(), isHarmony && harmonyRawfileHtml()],
    build: isHarmony
      ? {
          outDir: 'harmony/entry/src/main/resources/rawfile',
          modulePreload: false,
          cssCodeSplit: false,
          rollupOptions: {
            output: {
              format: 'iife',
              inlineDynamicImports: true,
            },
          },
        }
      : undefined,
  }
})

function harmonyRawfileHtml() {
  return {
    name: 'harmony-rawfile-html',
    transformIndexHtml(html: string) {
      return html
        .replace(/\s*<link rel="manifest"[^>]*>\n?/g, '')
        .replace(/\s*crossorigin(?:="[^"]*")?/g, '')
        .replace(/<script type="module"([^>]*)>/g, '<script defer$1>')
    },
  }
}

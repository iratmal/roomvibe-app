import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-assets',
      closeBundle() {
        // Copy public folder to dist-widget
        const publicDir = resolve(__dirname, 'public');
        const outDir = resolve(__dirname, 'dist-widget');
        
        // Copy artworks.json
        if (existsSync(`${publicDir}/artworks.json`)) {
          copyFileSync(`${publicDir}/artworks.json`, `${outDir}/artworks.json`);
        }
        
        // Copy rooms folder
        if (existsSync(`${publicDir}/rooms`)) {
          mkdirSync(`${outDir}/rooms`, { recursive: true });
          readdirSync(`${publicDir}/rooms`).forEach((file: string) => {
            copyFileSync(`${publicDir}/rooms/${file}`, `${outDir}/rooms/${file}`);
          });
        }
        
        // Copy art folder
        if (existsSync(`${publicDir}/art`)) {
          mkdirSync(`${outDir}/art`, { recursive: true });
          readdirSync(`${publicDir}/art`).forEach((file: string) => {
            copyFileSync(`${publicDir}/art/${file}`, `${outDir}/art/${file}`);
          });
        }
        
        console.log('✓ Assets copied to dist-widget');
      }
    }
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget/index.ts'),
      name: 'RoomVibe',
      formats: ['umd', 'es'],
      fileName: (format) => `roomvibe.widget.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    outDir: 'dist-widget',
    sourcemap: true
  }
})

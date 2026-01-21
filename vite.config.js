// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                analyze: resolve(__dirname, 'analyze.html'),
                survey: resolve(__dirname, 'survey.html'),
                image: resolve(__dirname, 'image.html'),
             },
         },
     },
})
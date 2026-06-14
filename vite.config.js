import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 👇 여기부터 추가: 로컬 프록시 설정
  server: {
    proxy: {
      '/everytime-api': {
        target: 'https://everytime.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/everytime-api/, '')
      }
    }
  }
})
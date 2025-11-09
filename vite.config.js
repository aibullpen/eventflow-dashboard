import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 📌 PostCSS/Tailwind를 로드하기 위해 필요한 모듈을 가져옵니다.
import postcss from 'postcss'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 🔨 핵심 수정: PostCSS 설정을 Vite에 통합하여 Tailwind CSS 컴파일을 강제합니다.
  css: {
    postcss: {
      plugins: [
        // 이미 프로젝트 루트에 tailwind.config.js와 postcss.config.js가 있다고 가정
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  }
})
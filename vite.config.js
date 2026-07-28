import { defineConfig } from 'vite' // 必须导入此函数
import vue from '@vitejs/plugin-vue'
import path from 'path' // 用于处理路径别名

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 设置 @ 指向 src 目录
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://101.34.239.144:8080',
        changeOrigin: true,
        // 如果后端接口本身不带 /api 前缀，请取消下面行的注释
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})
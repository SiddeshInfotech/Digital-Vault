import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __SYSTEM_INFO__: JSON.stringify({
      username: 'patil',
      displayName: 'Komal Patil',
      email: 'komalpatil2505@gmail.com',
      msEmail: 'komalpatil2505@outlook.com',
      hostname: 'localhost'
    })
  }
})

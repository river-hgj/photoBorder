import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const getBasePath = () => {
  if (!process.env.GITHUB_ACTIONS) {
    return '/'
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]

  if (!repositoryName || repositoryName.endsWith('.github.io')) {
    return '/'
  }

  return `/${repositoryName}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: getBasePath(),
  plugins: [react()],
})

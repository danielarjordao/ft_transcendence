import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveHttpsAssetPath(explicitPath: string | undefined, fallbackRelativePath: string) {
  const candidates = [
    explicitPath,
    path.resolve(__dirname, fallbackRelativePath),
  ].filter((value): value is string => Boolean(value))

  const resolvedPath = candidates.find((candidate) => fs.existsSync(candidate))

  if (!resolvedPath) {
    throw new Error(
      `HTTPS certificate file not found. Checked: ${candidates.join(', ')}`
    )
  }

  return resolvedPath
}

const httpsKeyPath = resolveHttpsAssetPath(
  process.env.VITE_HTTPS_KEY_PATH,
  '../certs/localhost-key.pem'
)

const httpsCertPath = resolveHttpsAssetPath(
  process.env.VITE_HTTPS_CERT_PATH,
  '../certs/localhost-cert.pem'
)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    https: {
      key: fs.readFileSync(httpsKeyPath),
      cert: fs.readFileSync(httpsCertPath),
    },
    host: '0.0.0.0',
    port: 5173,
  },
})

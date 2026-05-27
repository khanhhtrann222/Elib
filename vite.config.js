import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as fs } from 'fs'
import path from 'node:path'

function createLocalProjectSavePlugin() {
  return {
    name: 'vite-local-project-save',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method === 'POST' && req.url?.startsWith('/api/save-book')) {
          try {
            const body = await new Promise((resolve, reject) => {
              let raw = '';
              req.on('data', (chunk) => { raw += chunk; });
              req.on('end', () => resolve(JSON.parse(raw)));
              req.on('error', reject);
            });

            const projectRoot = process.cwd();
            const booksDir = path.join(projectRoot, 'public', 'books');
            const coversDir = path.join(projectRoot, 'public', 'covers');
            const metadataDir = path.join(projectRoot, 'public', 'metadata');

            await fs.mkdir(booksDir, { recursive: true });
            await fs.mkdir(coversDir, { recursive: true });
            await fs.mkdir(metadataDir, { recursive: true });

            if (body.pdfBase64) {
              await fs.writeFile(
                path.join(booksDir, `${body.bookId}.pdf`),
                Buffer.from(body.pdfBase64, 'base64')
              );
            }

            if (body.coverBase64) {
              const coverExt = body.coverExtension || 'png';
              await fs.writeFile(
                path.join(coversDir, `${body.bookId}.${coverExt}`),
                Buffer.from(body.coverBase64, 'base64')
              );
            }

            await fs.writeFile(
              path.join(metadataDir, `${body.bookId}.json`),
              JSON.stringify(body.bookMetadata, null, 2)
            );

            if (body.index) {
              await fs.writeFile(
                path.join(metadataDir, 'index.json'),
                JSON.stringify(body.index, null, 2)
              );
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, bookId: body.bookId }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error?.message || 'Save failed' }));
          }
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['b131-23-97-62-157.ngrok-free.app']
  },
  plugins: [react(), createLocalProjectSavePlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'pdfjs-worker';
          }
          if (id.includes('node_modules/@google/generative-ai')) {
            return 'gemini-sdk';
          }
          if (id.includes('src/features/admin')) {
            return 'admin-feature';
          }
          if (id.includes('src/features/reader')) {
            return 'reader-feature';
          }
        }
      }
    }
  }
})

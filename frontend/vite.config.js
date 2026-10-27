import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const demosDirectory = path.join(configDirectory, 'public', 'portfolio', 'sites');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function servePortfolioStaticDemos() {
  return {
    name: 'serve-portfolio-static-demos',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawPath = req.url?.split('?')[0] || '';
        if (rawPath !== '/portfolio/sites' && !rawPath.startsWith('/portfolio/sites/')) return next();
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET, HEAD');
          return res.end('Method Not Allowed');
        }
        if (rawPath === '/portfolio/sites') {
          res.statusCode = 404;
          return res.end('Not Found');
        }

        let requestedPath;
        try {
          requestedPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        } catch {
          res.statusCode = 400;
          return res.end('Bad Request');
        }

        const filePath = path.resolve(demosDirectory, requestedPath.slice('/portfolio/sites/'.length));
        if (!filePath.startsWith(`${demosDirectory}${path.sep}`) && filePath !== demosDirectory) {
          res.statusCode = 403;
          return res.end('Forbidden');
        }

        let targetPath = filePath;
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
          targetPath = path.join(targetPath, 'index.html');
        }
        if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
          res.statusCode = 404;
          return res.end('Not Found');
        }

        const stats = fs.statSync(targetPath);
        res.statusCode = 200;
        res.setHeader('Content-Type', mimeTypes[path.extname(targetPath).toLowerCase()] || 'application/octet-stream');
        res.setHeader('Content-Length', stats.size);
        if (req.method === 'HEAD') return res.end();

        const stream = fs.createReadStream(targetPath);
        stream.on('error', (error) => {
          if (!res.headersSent) res.statusCode = 500;
          res.end(error.message);
        });
        return stream.pipe(res);
      });
    },
  };
}

function copySpaRouteShells() {
  return {
    name: 'copy-spa-route-shells',
    apply: 'build',
    closeBundle() {
      const outputDirectory = path.join(configDirectory, 'dist');
      const rootShell = path.join(outputDirectory, 'index.html');

      for (const route of ['portfolio']) {
        const routeDirectory = path.join(outputDirectory, route);
        fs.mkdirSync(routeDirectory, { recursive: true });
        fs.copyFileSync(rootShell, path.join(routeDirectory, 'index.html'));
      }
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), servePortfolioStaticDemos(), copySpaRouteShells()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/devis-api': {
        target: 'https://zayer-devis-platform-2.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/devis-api/, ''),
      },
    },
  },
  build: { sourcemap: false },
});
